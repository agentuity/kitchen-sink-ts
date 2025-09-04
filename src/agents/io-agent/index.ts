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

  const content = await req.data.text();

  // Handoff processing to another agent
  if (content === 'Handoff') {
    try {
      return resp.handoff(
        {
          name: 'gateway-provider',
          // id: 'agent_123abc', // ID is preferred if the agent is outside of your current project, to ensure idempotency
        },
        {
          data: 'Tell me a short story about AI agents',
        }
      );
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Run and wait for a response from the agent
  if (content === 'Run') {
    try {
      const agent = await ctx.getAgent({
        name: 'gateway-provider',
        // id: 'agent_123abc', // ID is preferred if the agent is outside of your current project, to ensure idempotency
      });

      const result = await agent.run({
        data: 'Tell me a short story about AI agents',
      });

      return resp.text(await result.data.text());
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Fetch from agents with public access, via webhook or API
  // The example below is a complicated streaming example; a simple fetch works just as well
  // Using an agent's API is particularly useful for agents outside of your organization
  if (content === 'Public Agent') {
    const response = await fetch(
      // A public `handler-response` agent
      'https://agentuity.ai/api/a2d37fcdd47a1df58c621022909932ba',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Stream',
      }
    );

    if (!response.body) {
      ctx.logger.error('Error running agent: No response body available');

      return new Response('Internal Server Error', { status: 500 });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        result += decoder.decode(value, { stream: true });
      }

      return resp.text(result, 'text/markdown');
    } finally {
      reader.releaseLock();
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Agent-to-Agent IO</span> example agent.\n\n### About\n\nAgent-to-agent communication allows you to send messages to other agents within the same ecosystem, regardless of language or framework.\n\nYou can \`handoff()\` processing to an agent, at which point that agent becomes responsible for completing the request. You can also \`run()\` an agent if you need to wait for a response.\n\nAnd because every agent can be enabled for webhook or API IO, you can of course \`fetch()\` a response from an agent with public access.\n\n### Testing\n\nChoose one of the pre-set message options and we'll send a request to the "gateway-provider" storytelling agent and return the response to you.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Handoff`,
        contentType: 'text/plain',
      },
      {
        data: `Run`,
        contentType: 'text/plain',
      },
      {
        data: `Public Agent`,
        contentType: 'text/plain',
      },
    ],
  };
};
