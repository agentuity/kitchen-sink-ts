import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  // Verify webhook URL
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return resp.text('Please set DISCORD_WEBHOOK_URL in your .env file');
  }

  // JSON data is expected for Discord
  if (req.data.contentType !== 'application/json') {
    return resp.text('Please send JSON data for notifications');
  }

  try {
    // Generate summary of the event
    const result = await generateText({
      model: openai('gpt-5-nano'),
      system: `You are a notification assistant. Analyze this JSON event's data and create a clear, concise summary for a Discord notification. Focus on what happened, why it matters, and any key details. Keep it under 200 characters.`,
      prompt: await req.data.text(),
    });

    // Build payload
    const discordPayload = {
      username: 'Agentuity Agent',
      embeds: [
        {
          title: 'Notification',
          description: result.text,
          color: 0x5865f2, // Discord's blurple color
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Powered by Agentuity',
          },
        },
      ],
    };

    // Send notification
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (response.ok) {
      return resp.text('Notification sent to Discord successfully!');
    } else {
      const errorText = await response.text();

      ctx.logger.error('Discord webhook error:', errorText);

      return resp.text('Failed to send notification to Discord');
    }
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Discord</span> example agent.\n\n### About\n\nThis agent demonstrates how to send notifications to a Discord channel using webhooks.\n\n### Configuration\n\nCheck the agent README for instructions on how to set up Discord webhooks.\n\n### Testing\n\nSend JSON event data and the agent will analyze it and send a notification to your Discord channel.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
    prompts: [
      {
        data: JSON.stringify({
          type: 'demo_published',
          title: 'How to Schedule Your AI Agents with Cron Jobs',
          description:
            'Learn about running agents on a predetermined schedule or interval',
          url: 'https://www.youtube.com/watch?v=__m9SnhJXVM',
          platform: 'YouTube',
        }),
        contentType: 'application/json',
      },
      {
        data: JSON.stringify({
          type: 'product_announcement',
          title: 'Agents Spotlight',
          description: 'Discover and deploy open-source agents with one click',
          url: 'https://agentuity.com/spotlight',
          platform: 'Agentuity',
        }),
        contentType: 'application/json',
      },
    ],
  };
};
