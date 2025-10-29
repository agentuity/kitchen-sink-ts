import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest & {
    // NOTE: If you want to pass a custom header, you need to cast the request as below
    metadata: { headers: { 'x-custom-header': string } };
  },
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'agent handler request');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

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
    // case req.data.email()
    // case req.data.object()
    // case req.data.sms()
    // case req.data.stream()
    // ... and more all the time
  }

  // Trigger types
  let trigger: string = '';

  switch (req.trigger) {
    case 'manual':
      trigger = 'DevMode (manual)';
      break;
    // case 'agent':
    // case 'cron':
    // case 'email':
    // case 'queue':
    // case 'sms':
    // case 'voice':
    // case 'webhook':
    // ... and more all the time
  }

  // Custom headers
  // NOTE: Passing custom headers in DevMode prompts is not supported, but the line below demonstrates how to access it
  // const customHeaderValue = req.metadata.headers?.['x-custom-header'];

  return resp.text(
    prompt
      ? `You sent a \`${req.data.contentType}\` message via the ${trigger} trigger with the following data:\n\n` +
          '```json\n' +
          prompt +
          '\n```\n\n' +
          'And the following metadata:\n\n' +
          '```json\n' +
          JSON.stringify(req.metadata, null, 2) +
          '\n```'
      : `You sent a content type that isn't supported in this example`
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Agent Handler Request</span> example agent.\n\n### About\n\nData that is sent to your agent is transferred as raw binary data and the content type is provided to the agent through the request object.\n\nWe provide a few different ways to handle data formats in your agents to make it easier to work with different data types. Of course, your agent can always perform its own data handling by use the raw data and the content type property. However, most common data types are supported out of the box.\n\n### Testing\n\nSend a plain-text or JSON message with any content and we'll show you what the request looks like.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.\n\n### Learn More\n\nCheck out our [Agent Data Handling Guide](https://agentuity.dev/Guides/agent-data-handling) for more info and best practices.`,
    prompts: [
      {
        data: `Hello, world!`,
        contentType: 'text/plain',
        metadata: {
          headers: {
            'x-custom-header': 'my-value',
          },
        },
      },
      {
        data: `{"hello": "world"}`,
        contentType: 'application/json',
        metadata: {
          headers: {
            'x-custom-header': 'my-value',
          },
        },
      },
    ],
  };
};
