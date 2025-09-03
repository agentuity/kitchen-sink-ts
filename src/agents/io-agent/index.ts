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

  const help = await handleHelpMessage(
    req,
    resp,
    ctx,
    'agent-to-agent communication'
  );

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  // Handoff (to agents within the same project)
  try {
    return resp.handoff(
      { name: 'gateway-provider' },
      {
        data: req.data,
      }
    );
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }

  // Run (to agents outside the project, but within your same organization account)

  // Fetch (to public agents outside of your organization account)
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Agent-to-Agent IO</span> example agent.\n\n### About\n\nAgent-to-agent communication allows you to send messages to other agents within the same ecosystem, regardless of language or framework.\n\n### Testing\n\nSend a plain-text message with a story request and we'll send it to the  "gateway-provider" storytelling agent and return the value in a response to you.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Tell me a short story about AI agents`,
        contentType: 'text/plain',
      },
    ],
  };
};
