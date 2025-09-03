import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { detectHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await detectHelpMessage(req, resp);

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const bucket = 'kitchen-sink'; // You must create the bucket and select a provider first
  const key = `storage-object-store-${Date.now()}`;
  const content = await req.data.text();

  // Store plain-text content
  if (content === 'Test Plain-Text') {
    try {
      try {
        await ctx.objectstore.put(bucket, key, 'Hello, world!', {
          contentType: 'text/plain', // optional
          contentEncoding: 'utf-8', // optional
          cacheControl: 'max-age=60', // 1 minute, optional, defaults to forever
          contentLanguage: 'en-US', // optional
          metadata: {
            // optional
            'x-custom-metadata': 'my-value',
          },
        });
      } catch (_error) {
        return resp.text(
          'Make sure you have created the bucket and selected a provider first.'
        );
      }

      const result = await ctx.objectstore.get(bucket, key);

      if (result.exists) {
        await ctx.objectstore.delete(bucket, key);

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

  // Store image file
  if (content === 'Test Image File') {
    try {
      const file = Bun.file('./src/lib/test-files/test.png');
      const fileContent = await file.arrayBuffer();

      try {
        await ctx.objectstore.put(bucket, key, fileContent, {
          contentType: 'image/png', // optional
          contentDisposition: 'attachment; filename="test.png"', // optional
        });
      } catch (_error) {
        return resp.text(
          'Make sure you have created the bucket and selected a provider first.'
        );
      }

      const result = await ctx.objectstore.get(bucket, key);

      if (result.exists) {
        await ctx.objectstore.delete(bucket, key);

        return resp.png(await result.data.buffer());
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

  // Store markdown with a public URL
  if (content === 'Public URL') {
    try {
      try {
        await ctx.objectstore.put(
          bucket,
          key,
          '# Agentuity\n\nThis markdown file is accessible via a public URL',
          {
            contentType: 'text/markdown', // optional
            contentEncoding: 'utf-8', // optional
          }
        );
      } catch (_error) {
        return resp.text(
          'Make sure you have created the bucket and selected a provider first.'
        );
      }

      const publicUrl = await ctx.objectstore.createPublicURL(
        bucket,
        key,
        60 * 1000 // 1 minute, optional, defaults to 1 hour
      );

      return resp.markdown(
        `You can access the markdown file via this link for the next minute:\n\n${publicUrl}`
      );
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return resp.text('You sent an empty message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Object Store</span> example agent.\n\n### About\n\nObject storage is your solution for storing files, media, and large unstructured data that agents need to manage. Think of it as your agent's file system — perfect for documents, images, videos, backups, and any binary content.\n\n### Testing\n\nChoose one of the pre-set message options and we'll store it, retrieve it, delete it, and return the value in a response to you.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Test Plain-Text`,
        contentType: 'text/plain',
      },
      {
        data: `Test Image File`,
        contentType: 'text/plain',
      },
      {
        data: `Public URL`,
        contentType: 'text/plain',
      },
    ],
  };
};
