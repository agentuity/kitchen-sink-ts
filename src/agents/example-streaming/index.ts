import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';

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

  // Agent-to-agent streaming with resp.stream()
  if (prompt === 'Agent Chain') {
    try {
      ctx.logger.info('Initiating agent chain: calling example-chat');

      // Get reference to another agent in the project
      const chatAgent = await ctx.getAgent({ name: 'example-chat' });

      ctx.logger.debug(
        'Requesting "streaming benefits" explanation from example-chat agent'
      );

      // Call the agent with a custom prompt about streaming
      const response = await chatAgent.run({
        data: 'Write a response with the title "## Benefits of Real-Time Streaming" followed by 3 key benefits of streaming data in real-time applications. Be concise but helpful.',
      });

      ctx.logger.info(
        'Received response from example-chat, starting stream forwarding'
      );

      // Get and forward the stream from the agent's response
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

  // LLM streaming with pipeTo
  if (prompt === 'LLM Streaming') {
    try {
      ctx.logger.info('Starting LLM streaming with company overview');

      // Fetch Agentuity company information
      const response = await fetch('https://agentuity.com/llms.txt');
      const companyInfo = await response.text();

      // Create a stream with metadata
      const stream = await ctx.stream.create('llm-summary', {
        contentType: 'text/markdown',
        metadata: {
          type: 'llm-generation',
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
              'You are a technical writer creating executive summaries. Write in a professional, detailed style.',
            prompt: `Based on this company information, write a detailed executive summary (4-5 paragraphs) covering:\n1. Overview and core value proposition\n2. Key features and capabilities\n3. Benefits for developers and teams\n4. Target users and use cases\n5. Unique advantages\n\nCompany Information:\n${companyInfo}`,
          });

          // Pipe the text stream to our created stream
          await result.textStream.pipeTo(stream);

          ctx.logger.info('LLM streaming completed');
        } catch (error) {
          ctx.logger.error('Error in LLM streaming:', error);
          // Note: pipeTo automatically closes/aborts the stream, no need to close manually
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
          'Generating executive summary from company overview. Stream URL will show AI response as it generates.',
      });
    } catch (error) {
      ctx.logger.error('Error in LLM streaming:', error);
      return resp.text('Sorry, there was an error processing your request.');
    }
  }

  // Low-level (manual) streaming: stream.write() with progress tracking
  if (prompt === 'Manual Streaming') {
    try {
      ctx.logger.info('Starting batch processing example');

      // Generate a batch of items to process
      const batchSize = 100;
      const items = Array.from({ length: batchSize }, (_, i) => ({
        id: `item-${String(i + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        data: {
          value: Math.random() * 1000,
          category: ['A', 'B', 'C', 'D'][i % 4],
          priority: ['low', 'medium', 'high'][i % 3],
        },
      }));

      // Create a demo stream to show stream deletion
      const demoStream = await ctx.stream.create('batch-processing', {
        contentType: 'application/json',
        metadata: {
          type: 'batch-processing',
          purpose: 'demo',
          startTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        },
      });

      ctx.logger.info('Created demo stream for deletion');

      // Write some sample data and close it
      await demoStream.write(
        JSON.stringify({ demo: true, message: 'This stream will be deleted' }) +
          '\n'
      );
      await demoStream.close();

      // Create another stream
      const stream = await ctx.stream.create('batch-processing', {
        contentType: 'application/json',
        // Optionally, enable automatic gzip compression: `compress: true,`
        metadata: {
          // Metadata: organize streams by purpose, timestamps (for TTL-based cleanup), user IDs, etc.
          type: 'batch-processing',
          purpose: 'production',
          batchSize: String(batchSize), // Metadata values must be strings
          startTime: new Date().toISOString(),
          requestId: ctx.sessionId,
        },
      });

      ctx.logger.info('Stream created for batch processing', {
        streamId: stream.id,
        streamUrl: stream.url,
        compressed: stream.compressed,
        itemCount: batchSize,
      });

      // Use waitUntil for background processing
      ctx.waitUntil(async () => {
        try {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;

            // Simulate processing
            const processedItem = {
              ...item,
              status: 'completed',
              processedAt: new Date().toISOString(),
            };

            // Use `stream.write()` directly
            // The SDK handles writer management (acquisition and locking) automatically
            await stream.write(`${JSON.stringify(processedItem)}\n`);

            // Simulate processing time (100-300ms per item, avg 200ms)
            await new Promise((resolve) =>
              setTimeout(resolve, 100 + Math.random() * 200)
            );

            // Log progress periodically (every 10 items)
            if ((i + 1) % 10 === 0) {
              ctx.logger.info(
                `Batch progress: ${i + 1}/${items.length} items, ${stream.bytesWritten} bytes written`
              );
            }
          }

          ctx.logger.info(
            `Batch processing complete: ${items.length}/${items.length} items, ${stream.bytesWritten} bytes (uncompressed), compression: ${stream.compressed ? 'enabled' : 'disabled'}`
          );
        } finally {
          // Always close the stream when done
          await stream.close();
        }
      });

      // Demonstrate stream listing and deletion
      const allStreams = await ctx.stream.list({
        name: 'batch-processing',
      });

      ctx.logger.info(`Found ${allStreams.total} batch-processing stream(s)`);

      // Find and delete the demo stream (client-side filtering)
      // Alternatively, you could use server-side filtering: `metadata: { purpose: 'demo' }`
      const demoStreams = allStreams.streams.filter(
        (s) => s.metadata?.purpose === 'demo'
      );

      for (const demo of demoStreams) {
        await ctx.stream.delete(demo.id);
        ctx.logger.info(
          `Deleted demo stream: ${demo.id} (${demo.sizeBytes} bytes)`
        );
      }

      if (demoStreams.length > 0) {
        ctx.logger.info(
          `Cleanup complete: deleted ${demoStreams.length} demo stream(s)`
        );
      }

      // Return stream info immediately (non-blocking)
      return resp.json({
        streamId: stream.id,
        streamUrl: stream.url,
        status: 'processing',
        compressed: stream.compressed,
        itemCount: batchSize,
        message:
          'Batch processing started. Demo stream created and deleted to showcase stream management. Access the stream URL to see processing results.',
      });
    } catch (error) {
      ctx.logger.error('Error in batch processing:', error);
      return resp.text('Sorry, there was an error processing your request.');
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Streaming</span> example agent.\n\n### About\n\nThis agent demonstrates real-time streaming patterns from high-level to low-level control. Learn agent chaining with \`resp.stream()\`, LLM integration with \`pipeTo()\`, and manual control with \`stream.write()\`.\n\nLearn more: [Streaming Guide](https://agentuity.dev/Guides/agent-streaming)\n\n### Testing\n\nChoose a streaming pattern below to see different approaches to real-time data delivery.\n\n### Questions?\n\nYou can type "help" at any time to learn more about streaming capabilities, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Agent Chain',
        contentType: 'text/plain',
      },
      {
        data: 'LLM Streaming',
        contentType: 'text/plain',
      },
      {
        data: 'Manual Streaming',
        contentType: 'text/plain',
      },
    ],
  };
};
