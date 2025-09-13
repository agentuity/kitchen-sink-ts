import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'SMS IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const command = await req.data.text();

  // Send basic SMS message
  if (command === 'Send Basic SMS') {
    if (req.trigger === 'manual') {
      // Self-webhook pattern: DevMode (manual commands) call this agent's webhook to trigger SMS routing
      ctx.logger.info(
        'DevMode detected, triggering webhook for actual SMS delivery'
      );

      try {
        const response = await fetch(
          'https://agentuity.ai/webhook/ec172a94fefa741a46e5c1882f39dc99',
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: 'Send Basic SMS Webhook', // Different command to avoid loops
          }
        );

        if (response.ok) {
          ctx.logger.info('SMS sent successfully via webhook');
          return resp.markdown(`## SMS Sent Successfully!

**What happened:**
1. DevMode detected your command
2. Triggered webhook endpoint for actual SMS delivery
3. SMS was sent to configured phone number

Check your phone to see the text message!`);
        } else {
          throw new Error(`Webhook returned ${response.status}`);
        }
      } catch (error) {
        ctx.logger.error('Self-webhook failed:', error);
        return resp.text(
          'Please deploy this agent with SMS configuration to enable SMS sending from DevMode.'
        );
      }
    }
  }

  // Handle webhook self-call to prevent loops
  if (command === 'Send Basic SMS Webhook') {
    ctx.logger.info('Processing webhook self-call for SMS delivery');
    return resp.text(
      'Hello from Agentuity! This is a test SMS from the Kitchen Sink project.'
    );
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">SMS IO</span> example agent.\n\n### About\n\nThis agent demonstrates SMS messaging via Twilio integration. Your agents can receive and send SMS messages, but this example focuses on outbound SMS.\n\n### Configuration\n\nCheck the agent README for instructions on setting up Twilio credentials.\n\n### Testing\n\nClick the command to send an SMS message to your configured phone number.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Send Basic SMS',
        contentType: 'text/plain',
      },
    ],
  };
};
