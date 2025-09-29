import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';
import SAMPLE_ORDERS from './sample-data.json';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'agent streaming');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const prompt = await req.data.text();

  // Manual Progress - demonstrates ctx.stream.create() with manual writes
  if (prompt === 'Manual Progress') {
    try {
      ctx.logger.info('Starting manual progress streaming example');

      // Create a stream with a name and optional metadata
      const stream = await ctx.stream.create('order-processing', {
        contentType: 'application/json',
        metadata: {
          type: 'order-processing',
          batchSize: SAMPLE_ORDERS.length.toString(),
          startTime: new Date().toISOString(),
          requestId: ctx.sessionId,
        },
      });

      ctx.logger.info('Stream created', {
        streamId: stream.id,
        streamUrl: stream.url,
      });

      // Use waitUntil for background processing
      ctx.waitUntil(async () => {
        // Get a writer from the WritableStream
        const writer = stream.getWriter();

        try {
          // Process orders with manual stream writes
          for (let i = 0; i < SAMPLE_ORDERS.length; i++) {
            const order = SAMPLE_ORDERS[i];
            if (!order) continue;

            ctx.logger.info(
              `Processing order ${order.id} for ${order.customer}`
            );

            const progressData = {
              step: i + 1,
              total: SAMPLE_ORDERS.length,
              progress: Math.round(((i + 1) / SAMPLE_ORDERS.length) * 100),
              message: `Processing ${order.id} for ${order.customer}`,
              orderDetails: {
                items: order.items,
                total: order.total,
                priority: order.priority,
              },
              timestamp: new Date().toISOString(),
            };

            // Write JSON data with newline delimiter
            const chunk = `${JSON.stringify(progressData)}\n`;
            await writer.write(new TextEncoder().encode(chunk));

            // Simulate processing time
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          ctx.logger.info('Order processing batch completed');
        } finally {
          // Always release the lock and close the stream
          writer.releaseLock();
          await stream.close();
        }
      });

      // Return stream info immediately (non-blocking)
      return resp.json({
        streamId: stream.id,
        streamUrl: stream.url,
        status: 'processing',
        message:
          'Order processing started. Stream URL can be consumed multiple times.',
      });
    } catch (error) {
      ctx.logger.error('Error in manual progress streaming:', error);
      return resp.text('Sorry, there was an error processing your request.');
    }
  }

  // Background Stream - demonstrates LLM streaming with pipeTo
  if (prompt === 'Background Stream') {
    try {
      ctx.logger.info('Starting background LLM streaming example');

      // Create a stream with a name and optional metadata
      const stream = await ctx.stream.create('llm-response', {
        contentType: 'text/markdown',
        metadata: {
          type: 'llm-response',
          model: 'gpt-5-nano',
          requestId: ctx.sessionId,
        },
      });

      ctx.logger.info('Stream created', {
        streamId: stream.id,
        streamUrl: stream.url,
      });

      // Use waitUntil to handle streaming in the background
      ctx.waitUntil(async () => {
        try {
          const result = streamText({
            model: openai('gpt-5-nano'),
            system:
              'You are a helpful assistant that provides concise and accurate information.',
            prompt:
              'Write a short business report about Q3 2025 performance with sections for Executive Summary, Revenue Analysis, and Key Metrics. Use markdown formatting.',
          });

          // Pipe the text stream to our created stream
          await result.textStream.pipeTo(stream);

          ctx.logger.info('LLM streaming completed');
        } catch (error) {
          ctx.logger.error('Error in LLM streaming:', error);
          // Close the stream even if there's an error
          await stream.close();
        }
      });

      /**
       * Return stream info immediately (non-blocking)
       *
       * Note: You could also return the stream directly with `return stream`
       * This would automatically redirect the client to the stream URL
       * instead of returning JSON with the stream info
       */
      return resp.json({
        streamId: stream.id,
        streamUrl: stream.url,
        status: 'streaming',
        message:
          'LLM generation started. Stream URL will show AI response as it generates.',
      });
    } catch (error) {
      ctx.logger.error('Error in background streaming:', error);
      return resp.text('Sorry, there was an error processing your request.');
    }
  }

  // Agent Chain - demonstrates agent-to-agent streaming with resp.stream()
  if (prompt === 'Agent Chain') {
    try {
      ctx.logger.info('Initiating agent chain: calling example-chat');

      // Get reference to another agent in the project
      const chatAgent = await ctx.getAgent({ name: 'example-chat' });

      ctx.logger.debug(
        'Requesting streaming benefits explanation from example-chat agent'
      );

      // Call the agent with a custom prompt about streaming
      const response = await chatAgent.run({
        data: 'Write a response with the title "## Benefits of Real-Time Streaming" followed by 3 key benefits of streaming data in real-time applications. Be concise but helpful.',
      });

      ctx.logger.info(
        'Received response from example-chat, starting stream forwarding'
      );

      // Get the stream from the agent's response
      const responseStream = await response.data.stream();

      ctx.logger.debug('Stream forwarding initiated successfully');

      // Forward the stream directly to the client using resp.stream()
      return resp.stream(responseStream, 'text/markdown');
    } catch (error) {
      ctx.logger.error('Error in agent chain streaming:', error);
      return resp.text(
        'Sorry, there was an error with agent chaining. Please ensure the example-chat agent is available.'
      );
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Streaming</span> example agent.\n\n### About\n\nThis agent demonstrates real-time streaming patterns. Learn manual stream control with \`ctx.stream.create()\`, background processing with \`ctx.waitUntil()\`, and high-level streaming with \`resp.stream()\`.\n\nLearn more: [Streaming Guide](https://agentuity.dev/Guides/agent-streaming)\n\n### Testing\n\nChoose a streaming pattern below to see different approaches to real-time data delivery.\n\n### Questions?\n\nYou can type "help" at any time to learn more about streaming capabilities, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Manual Progress',
        contentType: 'text/plain',
      },
      {
        data: 'Background Stream',
        contentType: 'text/plain',
      },
      {
        data: 'Agent Chain',
        contentType: 'text/plain',
      },
    ],
  };
};
