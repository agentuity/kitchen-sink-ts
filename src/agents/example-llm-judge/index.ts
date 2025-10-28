import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { evaluationSchema, formatReport } from './story-eval';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Get the prompt from request, or use a default
    const prompt =
      (await req.data.text()) ||
      'Write a short story about an AI learning to paint';

    ctx.logger.info('Starting LLM-as-a-judge evaluation');

    // Get stories from gateway-provider
    const gatewayAgent = await ctx.getAgent({ name: 'gateway-provider' });
    const stories = await gatewayAgent.run({ data: prompt });
    const storiesText = await stories.data.text();

    ctx.logger.debug('Received stories from gateway-provider');

    // Create evaluation prompt
    const evaluationPrompt = `
You are evaluating two AI-generated short stories.

Here are the stories:

${storiesText}

Extract each story text:
- OpenAI story: appears after "### OpenAI (GPT-5 Nano)"
- Google story: appears after "### Google (Gemini 2.0 Flash)"

For each story, provide:
1. Creativity score (1-10): How original and imaginative is it?
2. Quality score (1-10): Overall writing quality
3. Strengths: What works well (1-2 sentences)

Finally, provide a verdict declaring which story is better and why (2-3 sentences).`;

    ctx.logger.info('Generating structured evaluation');

    // Generate structured evaluation
    const evaluation = await generateObject({
      model: openai('gpt-5-nano'),
      schema: evaluationSchema,
      system:
        'You are a literary critic evaluating short AI-generated stories.',
      prompt: evaluationPrompt,
    });

    // Log key metrics
    ctx.logger.debug('Evaluation scores', {
      openai: evaluation.object.openai.quality,
      google: evaluation.object.google.quality,
    });

    // Return formatted report
    return resp.markdown(formatReport(evaluation.object));
  } catch (error) {
    ctx.logger.error('Error in LLM judge evaluation:', error);
    return resp.text(
      'Sorry, there was an error running the evaluation. Please ensure the gateway-provider agent is available.'
    );
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">LLM-as-a-Judge</span> example agent.\n\n### About\n\nThis agent demonstrates the LLM-as-a-judge pattern, where one AI model evaluates the outputs of other models. It generates content using the gateway-provider agent (which uses two different AI models), then evaluates both outputs with structured scoring and feedback.\n\n### Testing\n\nTry the default prompt about AI learning to paint, or send your own story prompt. The agent calls \`gateway-provider\` to generate two stories (one from each AI model), then provides an evaluation comparing their creativity, quality, and strengths.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a specific example demonstration.`,
    prompts: [
      {
        data: 'Write a short story about an AI learning to paint',
        contentType: 'text/plain',
      },
    ],
  };
};
