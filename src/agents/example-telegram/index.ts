import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  return resp.empty();
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">[NAME]</span> example agent.\n\n### About\n\n[DESCRIPTION]\n\n### Testing\n\n[TEST_INFO]\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
    prompts: [
      {
        data: `Hello, world!`,
        contentType: 'text/plain',
      },
    ],
  };
};
