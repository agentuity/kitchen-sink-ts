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

  const help = await handleHelpMessage(req, resp, ctx, 'webhook IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    // Content type and data accessors
    let prompt: unknown = '';

    switch (req.data.contentType) {
      case 'application/json':
        prompt = JSON.stringify(await req.data.json(), null, 2);
        break;
      case 'text/plain':
        prompt = await req.data.text();
        break;
      // case req.data.base64()
      // case req.data.binary()
      // case req.data.buffer()
      // case req.data.object()
      // case req.data.stream()
      // NOTE: Webhook IO supports only a subset of data methods
    }

    // Schedule background processing (fire-and-forget)
    setImmediate(async () => {
      ctx.logger.info('Starting background processing');

      await new Promise((resolve) => setTimeout(resolve, 3000));

      ctx.logger.info('Background processing complete after 3 seconds');
    });

    // Return immediately
    return resp.text(
      prompt
        ? `Webhook received and queued for processing. Response sent immediately. Background processing continues for 3 seconds (check logs below).\n\n` +
            `You sent a \`${req.data.contentType}\` message with the following data:\n\n` +
            '```json\n' +
            prompt +
            '\n```\n\n' +
            'Metadata:\n' +
            '```json\n' +
            JSON.stringify(req.metadata, null, 2) +
            '\n```'
        : `You sent a content type that isn't supported in this example`
    );
  } catch (error) {
    ctx.logger.error('Error processing webhook:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Webhook IO</span> example agent.\n\n### About\n\nWebhook IO handles incoming HTTP requests with a fire-and-forget pattern. The agent responds immediately while processing continues asynchronously in the background.\n\n### Testing\n\nSend a message to see the immediate response. Background processing continues for 3 seconds after the response is sent (check logs).\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Test webhook',
        contentType: 'text/plain',
      },
      {
        data: '{"event": "test", "data": "webhook payload"}',
        contentType: 'application/json',
      },
    ],
  };
};
