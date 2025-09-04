import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import {
  type AssistantModelMessage,
  streamText,
  type UserModelMessage,
} from 'ai';

type Message = UserModelMessage | AssistantModelMessage;

export default async function Agent(
  req: AgentRequest & {
    metadata: {
      headers: {
        // NOTE: Not typically necessary, this is only to enable DevMode functionality
        'agentuity-metadata-devmodeuserid'?: string;
        [key: string]: string | undefined;
      };
    };
  },
  resp: AgentResponse,
  ctx: AgentContext
) {
  // Buckets are auto-created if they don't exist
  const bucket = 'kitchen-sink';

  // You should use whatever UUID makes sense for your use case, such as a user ID or a session ID
  const key = `example-chat-${req.metadata.headers['agentuity-metadata-devmodeuserid']}`;

  // Messages array
  let messages: Message[] = [];

  // Retrieve chat history and add user message
  try {
    const chatHistory = await ctx.kv.get(bucket, key);

    if (chatHistory.exists) {
      messages = (await chatHistory.data.json()) as Message[];
    }
  } catch (error) {
    ctx.logger.error('Error retrieving chat history:', error);
  }

  // Push the new message onto the messages array
  messages.push({
    role: 'user',
    content: await req.data.text(),
  });

  try {
    const result = await streamText({
      model: openai('gpt-5-mini'),
      system: `You are a helpful assistant that can have a conversation with the user. Try to limit your response length.`,
      messages, // Use `messages` instead of the typical `prompt` to keep context
    });

    const response = resp.stream(result.textStream, 'text/markdown');

    // Save to KV after stream completes
    (async () => {
      try {
        const finalText = await result.text;

        messages.push({
          role: 'assistant',
          content: finalText,
        });

        await ctx.kv.set(bucket, key, messages, {
          ttl: 60 * 60 * 24,
        });
      } catch (error) {
        ctx.logger.error('Error saving chat history:', error);
      }
    })();

    return response;
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Chat</span> example agent.\n\n### About\n\nThis agent demonstrates how to use Key-Value storage and the \`messages\` property of the AI SDK to have a conversation that maintains context.\n\n### Testing\n\nSend a plain-text message with any content and you can chat with the assistant.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a generic example.`,
    prompts: [
      {
        data: `Help me decide where to go for lunch today`,
        contentType: 'text/plain',
      },
    ],
  };
};
