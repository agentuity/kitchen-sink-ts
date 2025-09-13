import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';
import { DigestDataSchema, fetchTopHeadlines } from './hacker-news';

// Cron schedule interval in minutes
const INTERVAL = 5;

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'cron IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  // Handle cron trigger
  if (req.trigger === 'cron') {
    ctx.logger.info('Cron job started');

    try {
      const headlines = await fetchTopHeadlines(ctx, 5);

      const { text } = await generateText({
        model: openai('gpt-5-nano'),
        system:
          'Create a brief tech digest for developers based on headlines. Include a 2-3 sentence summary and one key takeaway. Keep under 300 words.',
        prompt: `Headlines from HackerNews: ${headlines.join('; ')}`,
      });

      // Create structured digest data with validation
      const digest = DigestDataSchema.parse({
        summary: text,
        sources: headlines,
        articleCount: headlines.length,
        timestamp: new Date().toISOString(),
        source: 'HackerNews API',
      });

      await ctx.kv.set('kitchen-sink', 'latest-digest', digest);
      ctx.logger.info('Tech digest created successfully');

      return resp.json({
        message: 'Tech digest created',
        ...digest,
      });
    } catch (error) {
      ctx.logger.error('Error creating digest:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Handle manual testing (DevMode)
  if (req.trigger === 'manual') {
    const command = await req.data.text();

    if (command === 'Fetch Top Story') {
      try {
        const articles = await fetchTopHeadlines(ctx, 1);
        return resp.markdown(`## API Test Successful

**Top Story on HackerNews:** ${articles[0]}

**Next Step:** Configure a cron schedule in the Agentuity web console for automatic digest creation.`);
      } catch (error) {
        ctx.logger.error('API test failed:', error);
        return resp.json({
          error: 'HackerNews API unavailable',
          message: 'Try again later',
        });
      }
    }

    if (command === 'Show Last Digest') {
      const latest = await ctx.kv.get('kitchen-sink', 'latest-digest');

      if (!latest.exists) {
        return resp.markdown(`## No Digest Available

This could mean:

- Cron job hasn't been configured yet
- Cron job hasn't run yet (runs every ${INTERVAL} minutes)

**Action Required:** Configure a cron schedule in the Agentuity web console.`);
      }

      try {
        const rawData = await latest.data.json();
        // Validate stored digest data
        const data = DigestDataSchema.parse(rawData);
        const timeAgo = Math.floor(
          (Date.now() - new Date(data.timestamp).getTime()) / 60000
        );

        return resp.markdown(`## Latest Tech Digest
*Generated ${timeAgo} minute${timeAgo !== 1 ? 's' : ''} ago from HackerNews*

### Summary
${data.summary}

---
*Analyzed ${data.articleCount} headlines from ${data.source}*`);
      } catch (error) {
        ctx.logger.error('Error reading digest:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return resp.text('You sent an invalid message.');
  }

  return resp.text('This agent responds to cron triggers and manual commands.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Cron IO</span> example agent.\n\n### About\n\nCron jobs enable agents to run automatically on schedules or predetermined intervals. This agent creates tech news digests every ${INTERVAL} minutes, fetching stories from HackerNews and generating AI summaries.\n\n### Testing\n\nSince cron triggers are scheduled by the platform (not DevMode), choose one of the manual test commands to simulate cron functionality or view stored results. Configure a cron schedule in the web console for automatic operation.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Fetch Top Story',
        contentType: 'text/plain',
      },
      {
        data: 'Show Last Digest',
        contentType: 'text/plain',
      },
    ],
  };
};
