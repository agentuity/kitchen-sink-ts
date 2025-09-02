import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const welcome = () => {
  return {
    welcome:
      "Welcome to the Vercel AI SDK with OpenAI Agent! I can help you build AI-powered applications using Vercel's AI SDK with OpenAI models.",
    prompts: [
      {
        data: 'How do I implement streaming responses with OpenAI models?',
        contentType: 'text/plain',
      },
      {
        data: 'What are the best practices for prompt engineering with OpenAI?',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const result = await streamText({
      model: openai('gpt-5-mini'),
      system:
        'You are a helpful assistant that provides concise and accurate information.',
      prompt: (await req.data.text()) ?? 'Hello, OpenAI',
    });

    return resp.stream(result.textStream);
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return resp.text('Sorry, there was an error processing your request.');
  }
}
