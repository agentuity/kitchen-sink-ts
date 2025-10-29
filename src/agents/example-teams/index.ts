import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { TurnContext, type Activity } from 'botbuilder';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import {
  ActivitySchema,
  adapter,
  hashUserId,
  handleProactiveMessage,
  type MessageHistory,
  type ConversationReferenceData,
} from './teams';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Get the Authorization header
    const headers = req.metadata.headers as Record<string, string> | undefined;
    const authHeader = headers?.authorization;

    // No auth header = proactive message request (curl/webhook/agent call)
    // Has auth header = Teams activity (normal conversation)
    if (!authHeader) {
      return handleProactiveMessage(req, resp, ctx);
    }

    // Validate the activity from the request body
    const parseResult = ActivitySchema.safeParse(await req.data.json());
    if (!parseResult.success) {
      ctx.logger.error('Invalid activity structure', {
        errors: parseResult.error.issues,
      });
      return resp.json(
        {
          error: 'Bad Request',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    /*
     * Zod provides early validation for fields the bot uses.
     * CloudAdapter performs complete Bot Framework validation afterward.
     */
    const activity = parseResult.data as unknown as Activity;
    // Without the Zod validation: activity = (await req.data.json()) as unknown as Activity

    ctx.logger.info('Processing Teams activity', {
      type: activity.type,
      from: activity.from?.name,
    });

    /*
     * Process the Teams activity using CloudAdapter's serverless-friendly method.
     * CloudAdapter handles:
     * - JWT validation against Microsoft's signing keys
     * - Bot Framework protocol compliance
     * - TurnContext creation with ConnectorClient for sending responses
     *
     * This approach is designed for serverless platforms like Agentuity,
     * unlike the traditional .process() method which requires Node HTTP objects.
     */
    await adapter.processActivityDirect(
      authHeader,
      activity,
      async (turnContext: TurnContext) => {
        // Handle incoming messages to the Teams bot
        if (turnContext.activity.type === 'message') {
          const userId = turnContext.activity.from.id;
          const userMessage = turnContext.activity.text;

          // Hash Teams user ID (~90 chars) to create shorter KV key (16 hex chars)
          const userKey = hashUserId(userId);

          // 1. Load conversation history from KV
          let messages: MessageHistory = [];
          try {
            const historyResult = await ctx.kv.get(
              'teams-chats',
              `chat-${userKey}`
            );
            if (historyResult.exists) {
              messages = (await historyResult.data.json()) as MessageHistory;
            }
          } catch (error) {
            ctx.logger.error('Error retrieving chat history:', error);
            // Continue with empty history
          }

          // 2. Add user message
          messages.push({
            role: 'user',
            content: userMessage,
            timestamp: Date.now(),
          });

          // 3. Trim to last 10 messages
          if (messages.length > 10) {
            messages.splice(0, messages.length - 10);
          }

          // 4. Generate AI response
          try {
            const result = await generateText({
              model: openai('gpt-5-nano'),
              system:
                'You are a helpful Teams assistant. Keep responses concise and friendly.',
              messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            });

            // 5. Send response to Teams
            await turnContext.sendActivity(result.text);

            // 6. Add assistant response to (KV storage) history
            messages.push({
              role: 'assistant',
              content: result.text,
              timestamp: Date.now(),
            });

            // 7. Save updated history to KV (24h TTL)
            await ctx.kv.set('teams-chats', `chat-${userKey}`, messages, {
              ttl: 86400, // 24 hours
            });

            // 8. Store conversation reference for proactive messaging
            try {
              const conversationRef = TurnContext.getConversationReference(
                turnContext.activity
              );

              const refData: ConversationReferenceData = {
                reference: conversationRef,
                fullUserId: userId,
                userKey: userKey,
                userName: turnContext.activity.from.name || 'Unknown',
                lastUpdated: Date.now(),
              };

              // Check if this is a new reference
              const existingRef = await ctx.kv.get(
                'teams-chats',
                `ref-${userKey}`
              );
              const isNewUser = !existingRef.exists;

              await ctx.kv.set('teams-chats', `ref-${userKey}`, refData, {
                ttl: 86400 * 30, // 30 days
              });

              // Only log for new users
              if (isNewUser) {
                ctx.logger.info('Conversation reference stored (new user)', {
                  userName: refData.userName,
                  userKey: userKey,
                  note: 'Use userKey in curl commands for proactive messaging',
                });
              }
            } catch (error) {
              ctx.logger.error('Error storing conversation reference:', error);
              // Non-critical - don't fail the request
            }

            ctx.logger.info('AI response sent', {
              messageCount: messages.length,
            });
          } catch (error) {
            ctx.logger.error('Error generating AI response:', error);
            await turnContext.sendActivity(
              'Sorry, I encountered an error processing your message. Please try again.'
            );
          }
        } else if (turnContext.activity.type === 'conversationUpdate') {
          // Set up a welcome message (first time the bot is added, new member joins, etc.)
          // This is also shown in the "Test in Web Chat" feature
          const membersAdded = turnContext.activity.membersAdded || [];
          for (const member of membersAdded) {
            if (member.id !== turnContext.activity.recipient.id) {
              await turnContext.sendActivity(
                "Hello! I'm an AI assistant. Send me a message and I'll help you with anything you need!"
              );
              ctx.logger.info('Welcome message sent', {
                memberName: member.name || 'unknown',
                memberId: member.id,
              });
            }
          }
        }
      }
    );

    return resp.text('', { status: 200 });
  } catch (error) {
    const err = error as Error;

    ctx.logger.error('Teams bot error', {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack,
    });

    return resp.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

export const welcome = () => ({
  welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Microsoft Teams</span> example agent.\n\n### About\n\nThis agent demonstrates how to create a Microsoft Teams bot with AI-powered conversations. It uses many of the same patterns as the \`example-chat\` agent (KV storage, conversation history, context retention), but adapted for Microsoft Teams.\n\n### Testing\n\nTesting is not available in DevMode for this agent. Add your bot to Microsoft Teams to test. See the README for Azure setup instructions.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
  prompts: [],
});
