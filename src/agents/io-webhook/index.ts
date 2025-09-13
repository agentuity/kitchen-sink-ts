import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { z } from 'zod';
import { handleHelpMessage } from '../../lib/utils';

// Zod schemas for webhook.site API responses
const WebhookTokenSchema = z.object({
  uuid: z.string(),
  created_at: z.string(),
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'webhook IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const command = await req.data.text();

  // Create a new webhook URL for monitoring
  if (command === 'Create Webhook URL') {
    try {
      // Check if we already have a webhook UUID stored
      const storedUuid = await ctx.kv.get('kitchen-sink', 'webhook-uuid');

      let uuid: string;
      let isNewWebhook = false;

      if (storedUuid.exists) {
        // Use existing webhook
        uuid = await storedUuid.data.text();
        ctx.logger.info(`Using existing webhook UUID: ${uuid}`);
      } else {
        // Create new webhook
        ctx.logger.info('Creating new webhook.site URL');
        const response = await fetch('https://webhook.site/token', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          ctx.logger.error('Webhook.site API error:', response.status);
          return resp.text('Webhook.site API unavailable, try again later');
        }

        const rawData = await response.json();
        const tokenData = WebhookTokenSchema.parse(rawData);
        uuid = tokenData.uuid;
        isNewWebhook = true;

        // Store webhook UUID in KV for later use
        await ctx.kv.set('kitchen-sink', 'webhook-uuid', uuid);
        ctx.logger.info(`New webhook URL created with UUID: ${uuid}`);
      }

      const webhookUrl = `https://webhook.site/${uuid}`;
      const dashboardUrl = `https://webhook.site/#!/view/${uuid}`;

      return resp.markdown(`**Webhook ${isNewWebhook ? 'Created' : 'Ready'}!**

${isNewWebhook ? '' : 'Using existing webhook endpoint.\n\n'}**Webhook Endpoint** (for sending webhooks):
${webhookUrl}

**Monitoring Dashboard** (to view received webhooks):
${dashboardUrl}

Open the monitoring dashboard in your browser to see webhooks arrive in real-time.
Then use "Send Test Webhook" to send a test message.`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.logger.warn('Invalid webhook.site response format:', error);
        return resp.text('Received unexpected response from webhook.site');
      }
      ctx.logger.error('Error creating webhook URL:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Send test webhook data to stored URL
  if (command === 'Send Test Webhook') {
    try {
      const uuidResult = await ctx.kv.get('kitchen-sink', 'webhook-uuid');

      if (!uuidResult.exists) {
        return resp.text(
          'No webhook URL found. Create one first using "Create Webhook URL".'
        );
      }

      const uuid = await uuidResult.data.text();
      const webhookUrl = `https://webhook.site/${uuid}`;
      const dashboardUrl = `https://webhook.site/#!/view/${uuid}`;

      // Sample webhook payload
      const webhookData = {
        message: 'Hello from Agentuity!',
        agent: 'io-webhook',
        timestamp: new Date().toISOString(),
        demo: true,
        description: 'This is a test webhook from the Kitchen Sink project',
      };

      ctx.logger.info(`Sending webhook to: ${webhookUrl}`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Agentuity-Webhook-Agent/1.0',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        ctx.logger.error('Webhook delivery failed:', response.status);
        return resp.text(
          'Webhook delivery failed. Check if your webhook URL is still valid.'
        );
      }

      ctx.logger.info('Webhook sent successfully');
      return resp.markdown(`**Webhook Sent Successfully!**

**What we sent:**
\`\`\`json
${JSON.stringify(webhookData, null, 2)}
\`\`\`

**Webhook Endpoint:**
${webhookUrl}

**View in Dashboard:**
${dashboardUrl}

Check the monitoring dashboard to see your delivered webhook with full details.`);
    } catch (error) {
      ctx.logger.error('Error sending webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Show the current webhook URL for monitoring
  if (command === 'View Webhook URL') {
    try {
      const uuidResult = await ctx.kv.get('kitchen-sink', 'webhook-uuid');

      if (!uuidResult.exists) {
        return resp.text(
          'No webhook URL found. Create one first using the "Create Webhook URL" command.'
        );
      }

      const uuid = await uuidResult.data.text();
      const webhookUrl = `https://webhook.site/${uuid}`;
      const dashboardUrl = `https://webhook.site/#!/view/${uuid}`;

      return resp.markdown(`**Your Webhook URLs:**

**Webhook Endpoint** (for sending webhooks):
${webhookUrl}

**Monitoring Dashboard** (to view received webhooks):
${dashboardUrl}

The monitoring dashboard shows all webhooks sent to your endpoint.`);
    } catch (error) {
      ctx.logger.error('Error retrieving webhook URL:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return resp.text(
    'You sent an invalid message. Try one of the suggested commands above.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Webhook IO</span> example agent.\n\n### About\n\nWebhooks enable agents to send HTTP notifications to external services. This agent demonstrates creating webhook endpoints and sending real webhook data for testing and integration purposes.\n\n### Testing\n\nCreate a webhook.site URL to monitor deliveries, then send test webhooks to see real-time webhook delivery in your browser.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Create Webhook URL',
        contentType: 'text/plain',
      },
      {
        data: 'View Webhook URL',
        contentType: 'text/plain',
      },
      {
        data: 'Send Test Webhook',
        contentType: 'text/plain',
      },
    ],
  };
};
