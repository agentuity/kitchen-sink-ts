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

  // Log plain-text content
  if (req.data.contentType === 'text/plain') {
    try {
      const message = await req.data.text();

      // Demonstrate different log levels
      ctx.logger.debug(`Debug: Processing message "${message}"`);
      ctx.logger.info(`Info: Received message "${message}"`);
      ctx.logger.warn(`Warning: Example warning for "${message}"`);
      ctx.logger.error(`Error: Example error for "${message}"`);

      // Return confirmation showing what was logged
      return resp.json({
        message: 'Logged at all severity levels',
        levels: ['debug', 'info', 'warn', 'error'],
        input: message,
      });
    } catch (error) {
      ctx.logger.error('Error processing text message:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Log JSON content
  if (req.data.contentType === 'application/json') {
    try {
      const data = await req.data.json();

      // Logging with the full data object
      ctx.logger.info('Structured data received', data);

      // Log at different levels
      ctx.logger.debug('Debug: Full request details', data);
      ctx.logger.warn('Warning: Example warning with data', data);

      // Return confirmation showing what was logged
      return resp.json({
        message: 'Logged structured data',
        data: data,
      });
    } catch (error) {
      ctx.logger.error('Error processing JSON message:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Observability Logging</span> example agent.\n\n### About\n\nLogging provides structured, real-time insights into your agent's execution. Use different log levels to categorize messages and include context for easier debugging.\n\n### Testing\n\nSend a plain-text or JSON message and we'll log it at various levels. Check your Agentuity logs to see the output!\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
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
