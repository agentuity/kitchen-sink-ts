import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { welcome as welcomeFrameworksProvider } from '../frameworks-provider';
import { welcome as welcomeGatewayByoToken } from '../gateway-byo-token';
import { welcome as welcomeGatewayProvider } from '../gateway-provider';
import { welcome as welcomeIOAgent } from '../io-agent';
import { welcome as welcomeStorageKeyValue } from '../storage-key-value';
import { welcome as welcomeStorageObjectStore } from '../storage-object-store';

export const welcome = () => {
  return {
    welcome: `This is a test suite for the Kitchen Sink project and is not intended to be run by users.\n\nProceeding to run the test suite may incur significant charges to your account.`,
  };
};

/*
 * NOTE:
 * This agent is used by Agentuity to test all of the various agents in the Kitchen Sink project;
 * it's not really intended to be run by you, one of our amazing users
 */

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  if ((await req.data.text()) !== 'RUN') {
    return resp.text(
      'This is a test suite for the Kitchen Sink project and is not intended to be run by users.\n\nProceeding to run the test suite may incur significant charges to your account.'
    );
  }

  const agents = [
    { name: 'frameworks-provider', welcome: welcomeFrameworksProvider },
    { name: 'gateway-byo-token', welcome: welcomeGatewayByoToken },
    { name: 'gateway-provider', welcome: welcomeGatewayProvider },
    { name: 'io-agent', welcome: welcomeIOAgent },
    { name: 'storage-key-value', welcome: welcomeStorageKeyValue },
    { name: 'storage-object-store', welcome: welcomeStorageObjectStore },
  ];

  let currentAgent = '';
  let currentPrompt = 0;

  try {
    for (const agent of agents) {
      currentAgent = agent.name;
      const instance = await ctx.getAgent({ name: agent.name });
      const prompts = agent.welcome().prompts;

      for (const prompt of prompts) {
        currentPrompt = prompts.indexOf(prompt);
        await instance.run(prompt);
      }
    }

    return resp.text('Test completed successfully');
  } catch (error) {
    ctx.logger.error(
      `Test failed while running "${currentAgent}" on prompt #${currentPrompt}\n\n${error}`
    );

    return new Response('Internal Server Error', { status: 500 });
  }
}
