import type {
  AgentContext,
  AgentRequest,
  AgentResponse,
  AgentResponseData,
} from '@agentuity/sdk';
import type { AppMentionEvent, GenericMessageEvent } from '@slack/types';
import crypto from 'crypto';

// Agentuity request morphs the request data, so we need to type it correctly
export type SlackAgentRequest = AgentRequest & {
  metadata: {
    headers: {
      'x-slack-signature'?: string;
      'x-slack-request-timestamp'?: string;
      'x-slack-retry-num'?: string;
      'x-slack-retry-reason'?: string;
      [key: string]: string | undefined;
    };
  };
};

// Verify we have a valid Slack webhook request and handle challenge / non-message events
export async function verifySlackWebhook(
  req: SlackAgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
): Promise<AgentResponseData | null> {
  try {
    const body = await req.data.json();
    const rawBody = await req.data.text(); // Raw body is required for signature verification
    const signature = req.metadata.headers['x-slack-signature'];
    const timestamp = req.metadata.headers['x-slack-request-timestamp'];

    if (!signature || !timestamp) {
      ctx.logger.error('Missing Slack signature or timestamp');

      return resp.empty();
    }

    // Verify timestamp is within 1 minute
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    if (Math.abs(currentTime - requestTime) > 60) {
      ctx.logger.error('Slack webhook timestamp too old');

      return resp.empty();
    }

    // Create the signature base string
    const sigBaseString = `v0:${timestamp}:${rawBody}`;

    // Create the signature
    const hmac = crypto.createHmac(
      'sha256',
      process.env.SLACK_SIGNING_SECRET || ''
    );

    hmac.update(sigBaseString);

    const expectedSignature = `v0=${hmac.digest('hex')}`;

    // Compare signatures
    if (signature !== expectedSignature) {
      ctx.logger.error('Slack webhook signature verification failed');

      return resp.empty();
    }

    // Parse event data to check for challenge
    const eventData = body as {
      type?: string;
      challenge?: string;
      event?: GenericMessageEvent | AppMentionEvent;
    };

    // Handle Slack challenge verification
    if (eventData.type === 'url_verification' && eventData.challenge) {
      ctx.logger.debug(
        `Handling Slack challenge verification: ${eventData.challenge}`
      );

      return resp.text(eventData.challenge);
    }

    // Check we have an event message
    if (!eventData.event) {
      ctx.logger.error('No event message found');

      return resp.empty();
    }

    // Check if the event is from a bot message to avoid infinite loops
    // biome-ignore lint/suspicious/noExplicitAny: Slack type def is missing user_id
    const botProfile = eventData.event.bot_profile as any;

    if (botProfile?.user_id && botProfile.user_id === eventData.event.user) {
      ctx.logger.debug('Message from the agent itself');

      return resp.empty();
    }

    // Check if the event is an app_mention
    if (eventData.event.type !== 'app_mention') {
      ctx.logger.info('Not an app_mention event, ignoring', {
        eventType: eventData.event.type,
        eventId: eventData.event.event_ts,
      });

      return resp.empty();
    }

    // ... continue processing
    return null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    ctx.logger.error('Error verifying Slack webhook: %o', errorMessage);

    return resp.empty();
  }
}
