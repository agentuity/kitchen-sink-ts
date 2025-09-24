import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { WebClient } from '@slack/web-api';
import { handleError } from '../../lib/utils';
import { welcome as welcomeExampleChat } from '../example-chat';
import { welcome as welcomeExampleComposio } from '../example-composio';
import { welcome as welcomeExampleDiscord } from '../example-discord';
import { welcome as welcomeFrameworksProvider } from '../frameworks-provider';
import { welcome as welcomeGatewayByoToken } from '../gateway-byo-token';
import { welcome as welcomeGatewayProvider } from '../gateway-provider';
import { welcome as welcomeHandlerContext } from '../handler-context';
import { welcome as welcomeHandlerRequest } from '../handler-request';
import { welcome as welcomeHandlerResponse } from '../handler-response';
import { welcome as welcomeIOAgent } from '../io-agent';
import { welcome as welcomeIOAPI } from '../io-api';
import { welcome as welcomeIOWebhook } from '../io-webhook';
import { welcome as welcomeObservabilityLogging } from '../observability-logging';
import { welcome as welcomeObservabilityTracing } from '../observability-tracing';
import { welcome as welcomeStorageKeyValue } from '../storage-key-value';
import { welcome as welcomeStorageObjectStore } from '../storage-object-store';
import { welcome as welcomeStorageVector } from '../storage-vector';

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
  if (req.trigger === 'manual') {
    return resp.text(
      'This is a test suite for the Kitchen Sink project and is not intended to be run by users.\n\nProceeding to run the test suite may incur significant charges to your account.'
    );
  }

  if (req.trigger !== 'cron' || (await req.data.text()) !== 'RUN') {
    return resp.empty();
  }

  const agents = [
    { name: 'example-chat', welcome: welcomeExampleChat },
    { name: 'example-composio', welcome: welcomeExampleComposio },
    { name: 'example-discord', welcome: welcomeExampleDiscord },
    { name: 'frameworks-provider', welcome: welcomeFrameworksProvider },
    { name: 'gateway-byo-token', welcome: welcomeGatewayByoToken },
    { name: 'gateway-provider', welcome: welcomeGatewayProvider },
    { name: 'handler-context', welcome: welcomeHandlerContext },
    { name: 'handler-request', welcome: welcomeHandlerRequest },
    { name: 'handler-response', welcome: welcomeHandlerResponse },
    { name: 'io-agent', welcome: welcomeIOAgent },
    { name: 'io-api', welcome: welcomeIOAPI },
    { name: 'io-webhook', welcome: welcomeIOWebhook },
    { name: 'observability-logging', welcome: welcomeObservabilityLogging },
    { name: 'observability-tracing', welcome: welcomeObservabilityTracing },
    { name: 'storage-key-value', welcome: welcomeStorageKeyValue },
    { name: 'storage-object-store', welcome: welcomeStorageObjectStore },
    { name: 'storage-vector', welcome: welcomeStorageVector },
    // { name: 'example-slack', welcome: welcomeExampleSlack },
    // { name: 'io-cron', welcome: welcomeIOCron },
    // { name: 'io-email', welcome: welcomeIOEmail },
    // { name: 'io-sms', welcome: welcomeIOSMS },
  ];

  let currentAgent = '';
  let currentPrompt = 0;

  try {
    // Agents with prompts

    for (const agent of agents) {
      currentAgent = agent.name;
      const instance = await ctx.getAgent({ name: agent.name });
      const prompts = agent.welcome().prompts;

      for (const prompt of prompts) {
        ctx.logger.info(
          `Running prompt #${prompts.indexOf(prompt)} for agent ${agent.name}`
        );

        currentPrompt = prompts.indexOf(prompt);

        await instance.run(prompt);
      }
    }

    // Agents without prompts

    // io-cron
    // The request of this agent comes via inbound cron IO automatically, nothing to do here

    // io-email
    // The response of this agent is sent via outbound email IO automatically, nothing to do here

    // io-sms
    // The response of this agent is sent via outbound SMS IO automatically, nothing to do here

    // example-slack
    const slack = new WebClient(process.env.SLACK_USER_TOKEN);

    slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_TEST || '',
      text: `Daily test message to <@${process.env.SLACK_BOT_ID}>. Please respond with a simple "Hello" to confirm you're working.`,
    });

    ctx.logger.info('Test completed successfully');

    return resp.text('Test completed successfully');
  } catch (error) {
    ctx.logger.error(
      `Test failed while running prompt #${currentPrompt} for agent ${currentAgent}\n\n${error}`
    );

    handleError(currentAgent, currentPrompt);

    return new Response('Kitchen Sink test suite failed.', { status: 500 });
  }
}
