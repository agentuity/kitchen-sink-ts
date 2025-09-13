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

  const command = await req.data.text();

  // Send basic text email
  if (command === 'Send Basic Email') {
    if (req.trigger === 'manual') {
      // Self-webhook pattern: DevMode (manual commands) call this agent's webhook to trigger email routing
      ctx.logger.info(
        'DevMode detected, triggering webhook for actual email delivery'
      );

      try {
        const response = await fetch(
          'https://agentuity.ai/webhook/ed67ba4cf89e4e46d3e9a54c127b9bf1',
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: 'Send Basic Email Webhook', // Different command to avoid loops
          }
        );

        if (response.ok) {
          ctx.logger.info('Email sent successfully via webhook');
          return resp.markdown(`## Email Sent Successfully!

**What happened:**
1. DevMode detected your command
2. Triggered webhook endpoint for actual email delivery  
3. Email was sent to configured recipients

Check your inbox to see the email!`);
        } else {
          throw new Error(`Webhook returned ${response.status}`);
        }
      } catch (error) {
        ctx.logger.error('Self-webhook failed:', error);
        return resp.text(
          'Please deploy this agent with email configuration to enable email sending from DevMode.'
        );
      }
    }
  }

  // Handle webhook self-call to prevent loops
  if (command === 'Send Basic Email Webhook') {
    ctx.logger.info('Processing webhook self-call for email delivery');
    return resp.text(
      'Hello from Agentuity!\n\nThis is a basic email sent from the Kitchen Sink io-email agent. You can configure an inbound email address for your agent to receive emails. For outbound, you can use that same address, or use the default "no-reply" address provided for you.'
    );
  }

  // Send HTML-formatted email
  if (command === 'Send HTML Email') {
    if (req.trigger === 'manual') {
      // DevMode detected - call our own webhook for actual email delivery
      ctx.logger.info(
        'DevMode detected, triggering webhook for HTML email delivery'
      );

      try {
        const response = await fetch(
          'https://agentuity.ai/webhook/ed67ba4cf89e4e46d3e9a54c127b9bf1',
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: 'Send HTML Email Webhook', // Different command to avoid loops
          }
        );

        if (response.ok) {
          ctx.logger.info('HTML email sent successfully via webhook');
          return resp.markdown(`## HTML Email Sent Successfully!

**What happened:**
1. DevMode detected your command
2. Triggered webhook endpoint for actual email delivery
3. HTML-formatted email was sent to configured recipients

Check your inbox to see the formatted email!`);
        } else {
          throw new Error(`Webhook returned ${response.status}`);
        }
      } catch (error) {
        ctx.logger.error('Self-webhook failed:', error);
        return resp.text(
          'Please deploy this agent with email configuration to enable email sending from DevMode.'
        );
      }
    }
  }

  // Handle webhook self-call for HTML email
  if (command === 'Send HTML Email Webhook') {
    ctx.logger.info('Processing webhook self-call for HTML email delivery');
    return resp.html(`
      <h1>Hello from Agentuity!</h1>
      <p>This demonstrates <strong>HTML email</strong> capabilities from the <span style="color: #0AA;">Kitchen Sink</span> io-email agent.</p>
      
      <p>Agents can return HTML responses for direct browser rendering. This lets you provide:</p>
      <ul>
        <li>Rich formatting</li>
        <li>Structured content</li>
        <li>Clean, consistent styling</li>
      </ul>
      
      <p><em>Explore the agent code to see how HTML responses are structured.</em></p>
    `);
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Email IO</span> example agent.\n\n### About\nThe Email IO allows agents to recieve inbound emails and send outbound emails. This agent demonstrates plain text and HTML email capabilities for outbound email integration.\n\n### Configuration\n\nCheck the agent README for instructions on configuring email recipients and sender addresses.\n\n### Testing\n\nChoose one of the pre-set commands to test a few different email formats you can send from an agent.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Send Basic Email',
        contentType: 'text/plain',
      },
      {
        data: 'Send HTML Email',
        contentType: 'text/plain',
      },
    ],
  };
};
