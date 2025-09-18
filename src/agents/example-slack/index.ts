import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import type { GenericMessageEvent } from '@slack/types';
import { WebClient } from '@slack/web-api';
import {
  type AssistantModelMessage,
  generateText,
  type UserModelMessage,
} from 'ai';
import { handleError } from '../../lib/utils';
import type { SlackAgentRequest } from './slack';
import { verifySlackWebhook } from './slack';

type Message = UserModelMessage | AssistantModelMessage;

// Required Slack OAuth Scopes:
// - app_mentions:read (for receiving @ mentions)
// - channels:history (for reading public channel messages)
// - chat:write (for posting messages)
// - im:history (for reading DM history if needed)
// - groups:history (for reading private channel history if needed)

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  // No manual trigger handling
  if (req.trigger === 'manual') {
    return resp.text('This agent only responds to Slack triggers.');
  }

  // Verify Slack webhook and handle challenge/validation before processing the request
  const verificationResponse = await verifySlackWebhook(
    req as SlackAgentRequest,
    resp,
    ctx
  );

  if (verificationResponse) {
    return verificationResponse;
  }

  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const { event } = await req.data.object<{ event: GenericMessageEvent }>();
  const threadTs = event.thread_ts ?? event.ts; // Acts as the UUID for the conversation

  // Slack wants a fast 200 OK response, so we return that immediately
  const response = resp.text('OK');

  try {
    (async () => {
      // Build conversation history from Slack thread
      const messages: Message[] = [];

      try {
        // Determine if this is a thread reply or a new message
        if (threadTs !== event.ts) {
          // This is a thread reply, get all thread messages
          // If you wanted to, you could store the thread history in a Key-Value cache (ctx.kv.get)
          const threadHistory = await slack.conversations.replies({
            channel: event.channel,
            ts: threadTs,
            inclusive: true,
          });

          if (threadHistory.messages) {
            for (const message of threadHistory.messages) {
              messages.push({
                role: message.bot_id ? 'assistant' : 'user',
                content: message.text || '',
              });
            }
          }
        } else {
          // This is a new message, add the current user message
          messages.push({
            role: 'user',
            content: event.text || '',
          });
        }
      } catch (error) {
        ctx.logger.warn('Failed to generate conversation:', error);

        handleError('example-slack'); // Used for Kitchen Sink testing purposes

        return new Response('Internal Server Error', { status: 500 });
      }

      // Generate a reply
      const result = await generateText({
        model: openai('gpt-5-mini'),
        system: `You are a helpful Slack bot assistant that can have a conversation with the user. Try to limit your response length.`,
        messages,
      });

      // Post reply to Slack thread
      await slack.chat.postMessage({
        channel: event.channel,
        thread_ts: threadTs,
        text: result.text,
      });
    })().catch((error) => {
      ctx.logger.error('Error processing Slack message:', error);

      handleError('example-slack'); // Used for Kitchen Sink testing purposes

      return new Response('Internal Server Error', { status: 500 });
    });

    return response;
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    handleError('example-slack'); // Used for Kitchen Sink testing purposes

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Slack</span> example agent.\n\n### About\n\nThis agent demonstrates how to use the Slack API to have a conversation with the user.\n\n### Configuration\n\nCheck the agent README for instructions on how to create your own Slack bot and install it in your Slack workspace.\n\n### Testing\n\n<span style="color: light-dark(#A00, #F66);">Testing is not available in DevMode for this agent.</span>\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
    prompts: [],
  };
};
