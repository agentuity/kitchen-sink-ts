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

  let prompt: unknown;

  // Get data in the appropriate format
  switch (req.data.contentType) {
    case 'application/json':
      prompt = await req.data.json();
      break;
    case 'text/plain':
      prompt = await req.data.text();
      break;
    default:
      prompt = await req.data.text();
      break;
  }

  return ctx.tracer.startActiveSpan('processing-data', async (span) => {
    try {
      // Add common attributes
      span.setAttribute('trigger', req.trigger);

      // Add type-specific attributes
      if (req.data.contentType === 'text/plain') {
        span.setAttribute('message.content', prompt as string);
        span.setAttribute('message.length', (prompt as string).length);
      } else {
        span.setAttribute('data.json', JSON.stringify(prompt));
        span.setAttribute('data.type', typeof prompt);
      }

      // Add event to mark processing start
      const startEvent =
        req.data.contentType === 'text/plain'
          ? {
              timestamp: Date.now(),
            }
          : {
              timestamp: Date.now(),
              hasData: prompt !== null,
              dataType: typeof prompt,
            };

      span.addEvent('processing-started', startEvent);

      // Process the data
      const result = {
        message: 'Event processed and traced',
        data: prompt as string,
        traced: true,
      };

      span.addEvent('processing-completed', result);

      // Set status to OK
      span.setStatus({ code: SpanStatusCode.OK });

      return resp.json(result);
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  });
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
