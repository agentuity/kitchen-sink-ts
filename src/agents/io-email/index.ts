import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { handleError, handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'email IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  try {
    // Handle email trigger
    if (req.trigger === 'email') {
      // Get email data
      const email = await req.data.email();
      const subject = email.subject() || 'No Subject';
      const from = email.fromEmail() || 'Unknown Sender';
      const textBody = email.text() || 'No Content';
      const htmlBody = email.html();
      const attachmentCount = email.attachments().length;

      // Send a reply back
      await email.sendReply(req, ctx, {
        subject: `Re: ${subject}`,
        text: `You sent an email with the following details:

From: ${from}
Subject: ${subject}
Attachments: ${attachmentCount}

Your message:
${textBody}`,
        html: `<h2>Email Received</h2>
<p>You sent an email with the following details:</p>
<ul>
  <li><strong>From:</strong> ${from}</li>
  <li><strong>Subject:</strong> ${subject}</li>
  <li><strong>Attachments:</strong> ${attachmentCount}</li>
</ul>
<h3>Your message:</h3>
<blockquote>${htmlBody || `<pre>${textBody}</pre>`}</blockquote>`,
      });

      return resp.text('Email processed and reply sent');
    }
  } catch (error) {
    ctx.logger.error('Error processing email:', error);

    handleError('io-email'); // Used for Kitchen Sink testing purposes

    return new Response('Internal Server Error', { status: 500 });
  }

  // No manual trigger handling
  return resp.text(
    'This agent only responds to email triggers. Deploy with Email IO configuration to test.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Email IO</span> example agent.\n\n### About\n\nEmail IO enables agents to receive and respond to emails. When configured, your agent gets a unique email address and can process incoming messages with full access to headers, attachments, and content.\n\n### Testing\n\n<span style="color: light-dark(#A00, #F66);">Testing is not available in DevMode for this agent.</span>\n\nThis agent requires deployment with Email IO configuration. Once deployed:\n1. Send an email to your agent's address\n2. Receive an auto-reply with your message details\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [],
  };
};
