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

  const help = await handleHelpMessage(req, resp, ctx, 'observability logging');

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

  try {
    // Demonstrate different log levels
    ctx.logger.debug('Logging a debug message: ', prompt);
    ctx.logger.info('Logging an info message: ', prompt);
    ctx.logger.warn('Logging a warning message: ', prompt);
    ctx.logger.error('Logging an error message: ', prompt);

    // You can create loggers with additional context, which child logs will inherit
    // The context is available in the "Metadata" section when inspecting a full log
    const childLogger = ctx.logger.child({ foo: 'bar' });
    childLogger.debug('Logging a child message: ', prompt);

    return resp.text('Check the logs below to see the output.');
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Observability Logging</span> example agent.\n\n### About\n\nLogging provides structured, real-time insights into your agent's execution. Use different log levels to categorize messages and include context for easier debugging.\n\n### Testing\n\nSend a plain-text or JSON message and we'll log it at various levels. Check your Agentuity logs below to see the output.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Testing agent logging`,
        contentType: 'text/plain',
      },
      {
        data: `{"user": "testuser", "action": "checkout", "amount": 99.99}`,
        contentType: 'application/json',
      },
    ],
  };
};
