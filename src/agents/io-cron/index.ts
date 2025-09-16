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

  // Handle cron trigger
  if (req.trigger === 'cron') {
    try {
      // Log execution time
      const executionTime = new Date().toISOString();
      ctx.logger.info('Cron job executed at:', executionTime);

      // Get any data passed (if configured)
      let prompt = '(No data configured)';

      try {
        if (req.data.contentType) {
          switch (req.data.contentType) {
            case 'application/json':
              prompt = JSON.stringify(await req.data.json(), null, 2);
              break;
            case 'text/plain':
              prompt = await req.data.text();
              break;
          }
        }
      } catch (_error) {
        ctx.logger.info('Error reading cron data, using default');
      }

      // Log execution details (cron jobs run in background)
      ctx.logger.info('Cron execution complete', {
        executionTime,
        trigger: req.trigger,
        data: prompt,
        metadata: req.metadata,
      });

      return resp.empty(); // No response body needed
    } catch (error) {
      ctx.logger.error('Error executing cron job:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // No manual trigger handling: Cron jobs only run on schedule
  return resp.text(
    'This agent only responds to cron triggers. Deploy with a cron schedule to test.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Cron IO</span> example agent.\n\n### About\n\nCron IO enables scheduled execution of agents at specified intervals. Configure schedules using standard cron expressions in the Agentuity console.\n\n### Testing\n\nThis agent requires deployment with a cron schedule configuration. Once deployed, it will execute automatically based on your configured schedule (e.g., "*/5 * * * *" for every 5 minutes).\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [], // No prompts (cron jobs cannot be tested in DevMode)
  };
};
