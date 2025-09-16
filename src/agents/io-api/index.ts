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

  const help = await handleHelpMessage(req, resp, ctx, 'API IO');

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
      // ... API IO doesn't have email() or sms() methods
    }

    // Trigger types
    let trigger: string = '';

    switch (req.trigger) {
      case 'manual':
        trigger = 'DevMode (manual)';
        break;
      case 'webhook':
        trigger = 'webhook';
        break;
      // case 'agent':
      // case 'cron':
      // ... API IO doesn't receive email or sms triggers
    }

    // Simulate API processing
    ctx.logger.info('Processing API request synchronously');
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const processingTime = Date.now() - startTime;
    ctx.logger.info(`API processing complete in ${processingTime}ms`);

    return resp.text(
      prompt
        ? `You sent a \`${req.data.contentType}\` message via the ${trigger} trigger with the following data:\n\n` +
            '```json\n' +
            prompt +
            '\n```\n\n' +
            'Metadata:\n' +
            '```json\n' +
            JSON.stringify(req.metadata, null, 2) +
            '\n```\n\n' +
            `Processing time: ${processingTime}ms (client waited for this response)\n\n` +
            `Note: API IO waits for complete processing before responding to the client.`
        : `You sent a content type that isn't supported in this example`
    );
  } catch (error) {
    ctx.logger.error('Error processing API request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">API IO</span> example agent.\n\n### About\n\nAPI IO demonstrates synchronous request handling where clients wait for complete processing. The agent processes the entire request before returning a response with full results.\n\n### Testing\n\nSend a message to see how API requests work. Notice the processing delay - the client waits for the full response.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Hello from API client',
        contentType: 'text/plain',
      },
      {
        data: '{"test": "data", "type": "API request"}',
        contentType: 'application/json',
      },
    ],
  };
};
