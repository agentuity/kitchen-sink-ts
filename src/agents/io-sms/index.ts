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

  try {
    // Handle SMS trigger
    if (req.trigger === 'sms') {
      // Get SMS data
      const sms = await req.data.sms();
      const phoneNumber = sms.from;
      const message = sms.text;

      // Send a reply back
      await sms.sendReply(
        req,
        ctx,
        `You sent an SMS with the following message:\n\n"${message}"\n\nFrom: ${phoneNumber}`
      );

      return resp.text('SMS processed and reply sent');
    }
  } catch (error) {
    ctx.logger.error('Error processing SMS:', error);

    return new Response('Internal Server Error', { status: 500 });
  }

  // No manual trigger handling
  return resp.text(
    'This agent only responds to SMS triggers. Deploy with SMS IO configuration and Twilio phone number to test.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">SMS IO</span> example agent.\n\n### About\n\nSMS IO enables agents to receive and respond to text messages via Twilio. When configured, your agent can process incoming SMS messages and send automatic replies.\n\n### Testing\n\n<span style="color: light-dark(#A00, #F66);">Testing is not available in DevMode for this agent.</span>\n\nThis agent requires deployment with SMS IO configuration. Once deployed:\n1. Text your agent's Twilio phone number\n2. Receive an auto-reply with your message details\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [],
  };
};
