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

  const help = await handleHelpMessage(req, resp, ctx, 'agent handler context');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const content = await req.data.text();

  // Session Data
  if (content === 'Session Data') {
    const sessionData = JSON.stringify(
      {
        sdkVersion: ctx.sdkVersion,
        devmode: ctx.devmode,
        sessionId: ctx.sessionId, // May be blank if running in DevMode
        orgId: ctx.orgId,
        deploymentId: ctx.deploymentId,
        projectId: ctx.projectId,
        scope: ctx.scope,
        agent: ctx.agent,
      },
      null,
      2
    );

    return resp.markdown(`\`\`\`json\n${sessionData}\n\`\`\``);
  }

  // Available Agents List
  if (content === 'Available Agents List') {
    const agentsList = JSON.stringify(ctx.agents.slice(0, 3), null, 2);

    return resp.markdown(
      `Showing first 3 available agents...\n\n\`\`\`json\n${agentsList}\n\`\`\``
    );
  }

  // ctx.kv             // Check out the `storage-key-value` example
  // ctx.objectstore    // Check out the `storage-object-store` example
  // ctx.vector         // Check out the `storage-vector` example
  // ctx.email          // Check out the `io-email` example
  // ctx.getAgent       // Check out the `io-agent` example
  // ctx.logger         // Check out the `observability-logging` example
  // ctx.meter          // Check out the `observability-tracing` example
  // ctx.tracer         // Check out the `observability-tracing` example
  // ... and more all the time

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Agent Handler Context</span> example agent.\n\n### About\n\nThrough the context object, you can access session information, other agents, the logger, storage options, and other resources available to your agent as provided by the Agentuity platform.\n\n### Testing\n\nChoose one of the pre-set message options and we'll show you the appropriate response.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Session Data`,
        contentType: 'text/plain',
      },
      {
        data: `Available Agents List`,
        contentType: 'text/plain',
      },
    ],
  };
};
