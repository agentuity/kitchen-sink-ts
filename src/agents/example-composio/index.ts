import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { generateText, stepCountIs } from 'ai';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const prompt = await req.data.text();

    // Initialize Composio
    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });

    // Initialize tools
    const tools = await composio.tools.get(
      'default', // The user ID to use for the tools; you can find this in the Composio UI, we're using the default user for this example
      {
        toolkits: ['HACKERNEWS'], // Provide a toolkit, or use `tools` to allow specific tools
      }
    );

    const toolCalls: unknown[] = []; // Store the tool calls here so we can show them in the response; not normally necessary

    const result = await generateText({
      model: openai('gpt-5-mini'),
      system: `
        You are an assistant that can use the Hacker News toolkit to find stories. Your tools will return multiple stories as JSON; you should determine which of those stories to return based on the user's request, pick those stories out from the JSON, and send them back in markdown in the following format:

        ## [TITLE]
        Posted at [TIME] by [AUTHOR]\n\n
        [NUMBER] points\n\n
        [LINK]
      `,
      prompt,
      tools,
      toolChoice: 'auto',
      stopWhen: stepCountIs(5), // By default, AI SDK stops once the tool is done; we want to analyze the tool response, so allow more than 1 step
      onStepFinish: (step) => {
        // Just for showing the tool usage, not normally necessary
        for (let i = 0; i < step.content.length; i++) {
          if (step.content[i]?.type === 'tool-call') {
            toolCalls.push(
              (step.content[i] as unknown as { toolName: string }).toolName
            );
          }
        }
      },
    });

    return resp.markdown(
      result.text +
        '\n\n---\n\n### Tool Calls\n\n' +
        '```' +
        toolCalls.join('\n') +
        '```'
    );
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Composio</span> example agent.\n\n### About\n\nComposio provides hundreds of tool integrations for AI agents to use, including CRMs, social media, productivity suites, and more. You can use these tools to create complex workflows and automate tasks by retrieving data from or sending data to external sources, while letting Composio handle the time-consuming integration glue work and authorizations.\n\n### Testing\n\nSend a plain-text message with any questions about Hacker News content and we'll show you the responses from tool calls.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
    prompts: [
      {
        data: `What's the top Hacker News story?`,
        contentType: 'text/plain',
      },
      {
        data: `Show me the 3 most popular Hacker News posts about AI agents`,
        contentType: 'text/plain',
      },
    ],
  };
};
