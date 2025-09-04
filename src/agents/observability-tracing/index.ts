import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { SpanStatusCode } from '@opentelemetry/api';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'observability tracing');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  // Trace plain-text content
  if (req.data.contentType === 'text/plain') {
    return ctx.tracer.startActiveSpan('process-text', async (span) => {
      try {
        const content = await req.data.text();

        // Add attributes to identify the span
        span.setAttribute('message.content', content);
        span.setAttribute('message.length', content.length);
        span.setAttribute('trigger', req.trigger);

        // Add event to mark processing
        span.addEvent('text-processing-started', {
          timestamp: Date.now(),
        });

        // Simulate some processing
        const result = {
          message: 'Text processed and traced',
          input: content,
          traced: true,
        };

        // Mark successful completion
        span.addEvent('text-processing-completed');
        span.setStatus({ code: SpanStatusCode.OK });

        return resp.json(result);
      } catch (error) {
        // Record error in the span
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });

        ctx.logger.error('Error processing text:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });
  }

  // Trace JSON content
  if (req.data.contentType === 'application/json') {
    return ctx.tracer.startActiveSpan('process-json', async (span) => {
      try {
        const data = await req.data.json();

        // Add structured attributes from the JSON data
        span.setAttribute('data.json', JSON.stringify(data));
        span.setAttribute('data.type', typeof data);
        span.setAttribute('trigger', req.trigger);

        // Add event with additional context
        span.addEvent('json-processing-started', {
          timestamp: Date.now(),
          hasData: data !== null,
          dataType: typeof data,
        });

        // Process the data
        const result = {
          message: 'JSON processed and traced',
          data: data,
          traced: true,
        };

        // Mark successful completion with metadata
        span.addEvent('json-processing-completed', {
          resultSize: JSON.stringify(result).length,
        });
        span.setStatus({ code: SpanStatusCode.OK });

        return resp.json(result);
      } catch (error) {
        // Record error in the span
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });

        ctx.logger.error('Error processing JSON:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    });
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Observability Tracing</span> example agent.\n\n### About\n\nTracing provides deep visibility into your agent's execution flow using OpenTelemetry. Create spans to track operations, add attributes for context, and record events to mark important moments.\n\n### Testing\n\nSend a plain-text or JSON message and we'll create traced spans with attributes and events. Check your Agentuity session timeline to see the traces!\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Testing agent tracing`,
        contentType: 'text/plain',
      },
      {
        data: `{"user": "testuser", "action": "checkout", "amount": 99.99}`,
        contentType: 'application/json',
      },
    ],
  };
};
