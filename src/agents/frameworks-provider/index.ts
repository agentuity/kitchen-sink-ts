import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { generateText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';

// NOTE: We've renamed the default function to AgentuityAgent to avoid conflicts with the Mastra Agent class
export default async function AgentuityAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'framework agnosticism');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    const prompt = await req.data.text();

    // Vercel AI SDK
    const resultAISDK = await generateText({
      model: openai('gpt-5-nano'),
      system:
        'You are a fantastic storyteller. Your story should be 50 words or less, in markdown format.',
      prompt,
    });

    // Mastra
    const mastraAgent = new Agent({
      name: 'Storyteller',
      model: openai('gpt-5-nano'),
      instructions:
        'You are a fantastic storyteller. Your story should be 50 words or less, in markdown format.',
    });

    const resultMastra = await mastraAgent.generateVNext(prompt); // Newer models require the newer `generateVNext` method instead of `generate`

    // Combined response
    return resp.markdown(
      `### Vercel AI SDK\n\n${resultAISDK.text}\n\n---\n\n### Mastra\n\n${resultMastra.text}`
    );
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Frameworks Provider</span> example agent.\n\n### About\n\nThe Agentuity platform is fundamentally cross-platform, allowing you to run different agent frameworks (CrewAI, Langchain, custom agents) side-by-side in the same ecosystem, with built-in communication channels and infrastructure between them.\n\n### Testing\n\nSend a plain-text message with any content and we'll show you the responses from two different frameworks.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Tell me a short story about AI agents`,
        contentType: 'text/plain',
      },
    ],
  };
};
