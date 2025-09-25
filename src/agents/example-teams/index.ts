import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { handleError } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  // No manual trigger handling
  if (req.trigger === 'manual') {
    return resp.text('This agent only responds to Teams triggers.');
  }

  try {
    // Get Teams activity data
    const teams = await req.data.teams();

    // Get message text from user
    const userMessage = await teams.message();

    if (!userMessage || userMessage.trim() === '') {
      return resp.text('OK'); // No text to process
    }

    // Fast 200 OK response
    const response = resp.text('OK');

    // Async processing: generate AI response and reply
    (async () => {
      try {
        // Generate AI response
        const result = await generateText({
          model: openai('gpt-5-mini'),
          system:
            'You are a helpful Microsoft Teams bot assistant. Keep responses concise and professional.',
          messages: [{ role: 'user', content: userMessage }],
        });

        // Send reply back to Teams
        await teams.sendReply(result.text);
      } catch (error) {
        ctx.logger.error('Error processing Teams message:', error);
        handleError('example-teams');
      }
    })();

    return response;
  } catch (error) {
    ctx.logger.error('Error parsing Teams request:', error);
    handleError('example-teams');
    return resp.text('OK');
  }
}

export const welcome = () => ({
  welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Microsoft Teams</span> example agent.\n\n### About\n\nThis agent demonstrates Microsoft Teams bot integration with AI-powered conversations using the Agentuity SDK and the Microsoft Bot Framework.\n\n### Testing\n\nTesting is not available in DevMode for this agent. Add your bot to a Teams channel to test.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
  prompts: [],
});
