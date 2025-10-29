import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'key-value storage');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const bucket = 'kitchen-sink'; // Buckets are auto-created if they don't exist
  const key = `storage-key-value-${Date.now()}`;

  // Store plain-text content
  if (req.data.contentType === 'text/plain') {
    try {
      const prompt = await req.data.text();

      await ctx.kv.set(bucket, key, prompt, {
        ttl: 60, // 1 minute, optional, defaults to forever
        contentType: 'text/plain', // optional
      });

      const result = await ctx.kv.get(bucket, key);

      if (result.exists) {
        await ctx.kv.delete(bucket, key);

        return resp.text(await result.data.text());
      } else {
        ctx.logger.error(
          'No content found for the given key in bucket:',
          bucket
        );

        return new Response('Internal Server Error', { status: 500 });
      }
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Store JSON content
  if (req.data.contentType === 'application/json') {
    try {
      const prompt = await req.data.json();

      await ctx.kv.set(bucket, key, prompt, {
        ttl: 60, // 1 minute, optional, defaults to forever
        contentType: 'application/json', // optional
      });

      const result = await ctx.kv.get(bucket, key);

      if (result.exists) {
        await ctx.kv.delete(bucket, key);

        return resp.json(await result.data.json());
      } else {
        ctx.logger.error(
          'No content found for the given key in bucket:',
          bucket
        );

        return new Response('Internal Server Error', { status: 500 });
      }
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Key-Value Store</span> example agent.\n\n### About\n\nKey-value storage is your go-to solution for fast, ephemeral data that agents need to access quickly. Think of it as your agent's short-term memory — perfect for session state, configuration, caching, and temporary data.\n\n### Testing\n\nSend a plain-text or JSON message with any content and we'll store it, retrieve it, delete it, and return the value in a response to you.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.\n\n### Learn More\n\nCheck out our [Key-Value Storage Guide](https://agentuity.dev/Guides/key-value) for more info and best practices.`,
    prompts: [
      {
        data: `Hello, world!`,
        contentType: 'text/plain',
      },
      {
        data: `{"hello": "world"}`,
        contentType: 'application/json',
      },
    ],
  };
};
