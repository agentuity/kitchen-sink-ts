import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'AI gateway');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    const prompt = await req.data.text();

    // OpenAI
    const resultOpenAI = await generateText({
      model: openai('gpt-5-nano'),
      system:
        'You are a fantastic storyteller. Your story should be 50 words or less, in markdown format.',
      prompt,
    });

    // Google
    const resultGoogle = await generateText({
      model: google('gemini-2.0-flash-001'),
      system:
        'You are a fantastic storyteller. Your story should be 50 words or less, in markdown format.',
      prompt,
    });

    // Combined response
    return resp.markdown(
      '### OpenAI (GPT-5 Nano)\n\n' +
        resultOpenAI.text +
        '\n\n---\n\n' +
        '### Google (Gemini 2.0 Flash)\n\n' +
        resultGoogle.text
    );
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">AI Gateway Provider</span> example agent.\n\n### About\n\nThe AI Gateway provides seamless access to multiple AI providers through a single interface. It automatically routes your LLM requests, tracks usage and costs, and eliminates the need to manage individual API keys for each provider.\n\n### Testing\n\nSend a plain-text message with any content and we'll show you the responses from two different providers.\n\nAfterwards, click on the session below to see what tracing is available, including usage and costs.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Tell me a short story about AI agents`,
        contentType: 'text/plain',
      },
    ],
  };
};
