import type {
  AgentContext,
  AgentRequest,
  AgentResponse,
  Data,
} from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { WebClient } from '@slack/web-api';
import { streamText } from 'ai';

/*
 * NOTE:
 * This code is used by the various agents to enable specific DevMode functionality
 * You can still reference it, but it's not super relevant to building your own agents
 */

export const handleHelpMessage = async (
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext,
  topic: string
) => {
  // Check if the request is a plain-text message and contains the word "help"
  if (
    req.data.contentType !== 'text/plain' ||
    (await req.data.text()).trim().toLowerCase() !== 'help'
  ) {
    return null;
  }

  // Retrieve the latest Agentuity docs and store them in a KV cache (1 day TTL)
  let agentuityDocs: string | undefined | Data;

  try {
    const docsResult = await ctx.kv.get('kitchen-sink', 'agentuity-docs');

    if (docsResult.exists) {
      agentuityDocs = await docsResult.data.text();
    } else {
      try {
        const response = await fetch('https://agentuity.dev/llms.txt');

        agentuityDocs = await response.text();

        await ctx.kv.set('kitchen-sink', 'agentuity-docs', agentuityDocs, {
          ttl: 60 * 60 * 24,
        });
      } catch (error) {
        ctx.logger.error('Error fetching Agentuity docs:', error);

        return new Response('Internal Server Error', { status: 500 });
      }
    }
  } catch (error) {
    ctx.logger.error('Error fetching Agentuity docs:', error);

    return new Response('Internal Server Error', { status: 500 });
  }

  // Respond to the user's request
  try {
    const result = await streamText({
      model: openai('gpt-5-mini'),
      system: `
      ## You

      You are a developer evangelist that knows a lot about software development for AI agents, and specifically the Agentuity cloud platform and it's features.

      ## Your Goal

      Provide the user with a high-level overview of the feature they're asking about. Do NOT include information that isn't directly related to the feature they're asking about, e.g. giving a long response about how to test a feature. Do NOT include sections that only talk about workflows, troubleshooting, best practices, limitations, etc; keep this high-level and general.

      ## Response Format

      Your response should be in markdown format.

      - Prioritize readability in your markdown formattin by using headings/subheadings, paragraphs, bold, italics, inline code tags, etc.
      - Do your best to not include code samples, only do so if absolutely necessary (and if so, keep them short and concise)
        - The user is writing an agent in TypeScript, so please make sure any code samples are in TypeScript
      - Do NOT offer to have a conversation with the user, you are acting like a CLI "--help" command

      ## Response Structure

      - An overview section, no heading
      - A H2-titled section, specifically titled "Why is this feature useful?", that explains why this feature is useful and important to know about
      - Any _highly_ relevant additional information under an H2 heading that fits the content (not just "Highly Relevant Information")
        - You may include H3-titled sub-sections
      - Finish with the following: \`## Have more questions?\n\nYou can chat with our expert agent by selecting the "kitchen-sink" agent.\`

      ## Agentuity Documentation

      ${agentuityDocs}
    `,
      prompt: `Tell me about the following Agentuity cloud platform feature: ${topic}`,
    });

    return resp.stream(result.textStream, 'text/markdown');
  } catch (error) {
    ctx.logger.error('Error responding to user:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
};

export const handleError = (agent: string, prompt?: number) => {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  slack.chat
    .postMessage({
      channel: process.env.SLACK_CHANNEL_ALERTS || '',
      text: `🛑 Test suite failed while running prompt #${prompt || 0} for agent ${agent}`,
    })
    .catch((error) => console.error('Error sending Slack message:', error));
};
