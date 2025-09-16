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

  const help = await handleHelpMessage(req, resp, ctx, 'cron IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    // Handle cron trigger
    if (req.trigger === 'cron') {
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
        // NOTE: Cron IO supports only a subset of data methods
      }

      return resp.text(
        prompt
          ? `You sent a \`${req.data.contentType}\` message with the following data:\n\n` +
              '```json\n' +
              prompt +
              '\n```\n\n' +
              'Metadata:\n' +
              '```json\n' +
              JSON.stringify(req.metadata, null, 2) +
              '\n```\n\n' +
              `Note: API IO waits for complete processing before responding to the client.`
          : `You sent a content type that isn't supported in this example`
      );
    }
  } catch (error) {
    ctx.logger.error('Error executing cron job:', error);

    return new Response('Internal Server Error', { status: 500 });
  }

  // No manual trigger handling
  return resp.text(
    'This agent only responds to cron triggers. Deploy with a cron schedule to test.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Cron IO</span> example agent.\n\n### About\n\nCron IO enables scheduled execution of agents at specified intervals. Configure schedules using standard cron expressions in the Agentuity console.\n\n### Testing\n\n<span style="color: light-dark(#A00, #F66);">Testing is not available in DevMode for this agent.</span>\n\nThis agent requires deployment with a cron schedule configuration. Once deployed, it will execute automatically based on your configured schedule (e.g., \`*/5 * * * *\` for every 5 minutes).\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [],
  };
};
