import type {
  AgentContext,
  AgentRequest,
  AgentResponse,
  Data,
} from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import {
  type AssistantModelMessage,
  generateObject,
  streamText,
  type UserModelMessage,
} from 'ai';
import { z } from 'zod';
// import { replaceCircularReferences } from '../../lib/utils';

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Kitchen Sink</span> project, a showcase of Agentuity's SDK functionality. You can ask me questions about Agentuity, the SDK, or specific agents within the project.\n\nTo get started, select an agent to run. If this is your first time here, start with the <span style="color: light-dark(#0AA, #0FF);">Handler</span> agents.\n\n### Questions?\n\nYou can chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent, or find out more about specific features by sending "help" as plain-text to one of our other agents.`,
  };
};

type Message = UserModelMessage | AssistantModelMessage;

export default async function Agent(
  req: AgentRequest & {
    metadata?: {
      headers?: {
        'agentuity-metadata-devmodeuserid'?: string;
        [key: string]: string | undefined;
      };
    };
  },
  resp: AgentResponse,
  ctx: AgentContext
) {
  let requestingAgent = null;
  let messages: Message[] = [];

  if (req.trigger === 'agent') {
    // Handle incoming "Help" requests from other agents
    const agentId = req.metadata.headers?.tracestate
      ?.split(',')
      .find((pair) => pair.startsWith('id='))
      ?.split('=')[1];

    requestingAgent = (await ctx.getAgent({ id: agentId! })).name;
  } else {
    // Retrieve chat history and add user message
    try {
      const chatHistory = await ctx.kv.get(
        'kitchen-sink',
        `chat-${req.metadata.headers?.['agentuity-metadata-devmodeuserid']}`
      );

      if (chatHistory.exists) {
        messages = (await chatHistory.data.json()) as Message[];
      }
    } catch (error) {
      ctx.logger.error('Error retrieving chat history:', error);
    }

    messages.push({
      role: 'user',
      content: await req.data.text(),
    });
  }

  // Retrieve the latest Agentuity docs and store them in a KV cache (1 day TTL)
  let agentuityDocs: string | undefined | Data;

  try {
    const docsResult = await ctx.kv.get('kitchen-sink', 'agentuity-docs');

    if (docsResult.exists) {
      agentuityDocs = await docsResult.data.text();
    } else {
      try {
        const response = await fetch('https://agentuity.dev/llms.txt');

        agentuityDocs = await response.text();

        await ctx.kv.set('kitchen-sink', 'agentuity-docs', agentuityDocs, {
          ttl: 60 * 60 * 24,
        });
      } catch (error) {
        ctx.logger.error('Error fetching Agentuity docs:', error);

        return new Response('Internal Server Error', { status: 500 });
      }
    }
  } catch (error) {
    ctx.logger.error('Error fetching Agentuity docs:', error);

    return new Response('Internal Server Error', { status: 500 });
  }

  try {
    const result = await streamText({
      model: openai('gpt-5-mini'),
      system: `
        You are a developer evangelist that knows a lot about software development for AI agents, and specifically the Agentuity cloud platform.

        ${
          requestingAgent
            ? `
            The user is asking a question specifically about: ${requestingAgent.split('-').slice(1).join('-')}

            Provide the user with an overview of the feature they're asking about. Do NOT offer to have a conversation with the user, you are acting like a CLI "--help" command. You should end the conversation by telling the user they can have a conversation with our expert agent by selecting the "kitchen-sink" agent, under an H2 heading of "Have more questions?".
          `
            : `
            Your goal is to provide the user with relevant, contextual, accurate, and helpful information. If you don't know the answer, ask follow-up questions to help you understand the user's question better. You should only source your answers from the Agentuity Documentation; do NOT make up information, or infer from anything outside of the Agentuity Documentation.
          `
        }

        Your response should be in markdown format.

        Agentuity Documentation:
        ----------------
        ${agentuityDocs}
      `,
      messages,
    });

    const response = resp.stream(result.textStream, 'text/markdown');

    // Post-response actions, run after the response is streamed
    Promise.resolve().then(async () => {
      // Add assistant response to messages array and update KV
      const finalText = await result.text;

      messages.push({
        role: 'assistant',
        content: finalText,
      });

      // Compact conversation history if necessary
      const totalUsage = await result.totalUsage;
      const totalTokens =
        (totalUsage?.inputTokens ?? 0) + (totalUsage?.outputTokens ?? 0);

      ctx.logger.info('Conversation history tokens:', {
        totalTokens,
        inputTokens: totalUsage?.inputTokens,
        outputTokens: totalUsage?.outputTokens,
      });

      // if (totalTokens > 350000) {
      if (messages.length >= 4) {
        ctx.logger.info(
          'Conversation history has reached the maximum number of tokens. Compacting...'
        );

        const compactedChatHistory = await generateObject({
          model: openai('gpt-5-nano'),
          system: `
            Summarize the conversation history into a single "assistant" message. Make sure to preserve the intent and author attribution of the conversation. You can remove any information that is not relevant to the conversation, and you can remove code blocks if they aren't necessary.
        
            Your goal is to reduce the number of tokens in the conversation history to the smallest possible number, IMPORTANTLY, while preserving the intent of the conversation.
        
            Start the message with the following: "# Conversation History Summary"
            `,
          messages,
          schema: z.object({
            messages: z.array(
              z.object({
                role: z.enum(['assistant']),
                content: z.string(),
              })
            ),
          }),
        });

        messages = compactedChatHistory.object.messages as Message[];
      }

      await ctx.kv.set(
        'kitchen-sink',
        `chat-${req.metadata.headers?.['agentuity-metadata-devmodeuserid']}`,
        messages,
        {
          ttl: 60 * 60 * 24,
        }
      );

      return;
    });

    return response;
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}
