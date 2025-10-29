import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
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
    'bring-your-own LLM API token'
  );

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    const prompt = await req.data.text();

    const anthropic = await createAnthropic({
      // Set this in your .env file(s)
      //
      // When deploying an agent, you'll need to run
      //    agentuity env set --secret ANTHROPIC_API_KEY sk-ant-...
      // to set the secret in the cloud environment
      //
      // You can also set the key in the Agentuity web app in your project's settings
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const result = await streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system:
        'You are a fantastic storyteller. Your story should be 50 words or less, in markdown format.',
      prompt,
    });

    return resp.stream(result.textStream, 'text/markdown');
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">AI Gateway Bring-Your-Own-Token</span> example agent.\n\n### About\n\nThe AI Gateway provides seamless access to multiple AI providers through a single interface. It automatically routes your LLM requests, tracks usage and costs, and eliminates the need to manage individual API keys for each provider.\n\nYou can, however, choose to _bring your own token_ instead of utilizing the AI Gateway. This allows you to use your own API keys for the AI providers, but means you won't have access to the same features as the AI Gateway, such as tracing and usage metrics.\n\n### Testing\n\nStart by saving your OpenAI API key in your .env file(s). Make sure to remove the key from your .env file when you're done testing and want to go back to using the AI Gateway.\n\nThen send a plain-text message with any content and we'll show you the response.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.\n\n### Learn More\n\nCheck out our [AI Gateway Guide](https://agentuity.dev/Guides/ai-gateway) for more info and best practices.`,
    prompts: [
      {
        data: `Tell me a short story about AI agents`,
        contentType: 'text/plain',
      },
    ],
  };
};
