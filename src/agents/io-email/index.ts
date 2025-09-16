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

  const help = await handleHelpMessage(req, resp, ctx, 'email IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  // Handle email trigger
  if (req.trigger === 'email') {
    try {
      // Get email data
      const email = await req.data.email();

      // Log received details
      ctx.logger.info('Received email:', {
        from: email.fromEmail(),
        subject: email.subject(),
        messageId: email.messageId(),
      });

      // Extract content
      const subject = email.subject() || 'No subject';
      const from = email.fromEmail() || 'Unknown sender';
      const textBody = email.text() || 'No text content';
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

      ctx.logger.info('Email reply sent successfully');
      return resp.text('Email processed and reply sent');
    } catch (error) {
      ctx.logger.error('Error processing email:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // No manual trigger handling: Email IO requires deployment
  return resp.text(
    'This agent only responds to email triggers. Deploy with Email IO configuration to test.'
  );
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Email IO</span> example agent.\n\n### About\n\nEmail IO enables agents to receive and respond to emails. When configured, your agent gets a unique email address and can process incoming messages with full access to headers, attachments, and content.\n\n### Testing\n\nThis agent requires deployment with Email IO configuration. Once deployed:\n1. Send an email to your agent's address\n2. Receive an auto-reply with your message details\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [], // No prompts (email IO cannot be tested in DevMode)
  };
};
