import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  type TurnContext,
  type ConversationReference,
} from 'botbuilder';
import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { z } from 'zod';
import crypto from 'crypto';

// Conversation history type for KV storage
export type MessageHistory = Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}>;

// Conversation reference storage for proactive messaging
export type ConversationReferenceData = {
  reference: Partial<ConversationReference>;
  fullUserId: string; // Full Teams user ID (29:1-...)
  userKey: string; // Hashed user ID (16 chars)
  userName: string; // User's display name
  lastUpdated: number; // Timestamp
};

// Validate only the Activity fields that our bot logic actually uses.
// CloudAdapter performs its own validation later on.
export const ActivitySchema = z.looseObject({
  type: z.string(),
  from: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
  conversation: z.object({
    id: z.string(),
  }),
  recipient: z.object({
    id: z.string(),
  }),
  text: z.string().optional(),
  membersAdded: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
      })
    )
    .optional(),
});

// Bot Framework authentication using Azure Bot Service credentials.
// This configures CloudAdapter to validate incoming requests from Microsoft Teams.
const auth = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId: process.env.TEAMS_BOT_APP_ID,
  MicrosoftAppPassword: process.env.TEAMS_BOT_APP_PASSWORD,
  MicrosoftAppType: 'SingleTenant',
  MicrosoftAppTenantId: process.env.TEAMS_BOT_TENANT_ID,
});

// CloudAdapter processes Teams activities and manages Bot Framework protocol
export const adapter = new CloudAdapter(auth);

// Global error handler for Bot Framework errors.
// Sends a message to Teams while detailed errors are logged separately.
adapter.onTurnError = async (context: TurnContext, _error: Error) => {
  await context.sendActivity('Sorry, something went wrong!');
};

// Hash Teams user ID (~90 chars) to create shorter KV key (16 hex chars)
export function hashUserId(userId: string): string {
  return crypto
    .createHash('sha256')
    .update(userId)
    .digest('hex')
    .substring(0, 16);
}

/*
 * Proactive message handler
 * Triggered when request has no Teams Authorization header (curl/webhook).
 *
 * This example sends to a specific user. For broadcast functionality
 * (e.g., announcements to all users), you can list all keys in the
 * 'teams-chats' bucket using ctx.kv.list() and loop through them.
 *
 * Useful for: cron-triggered notifications, system-wide announcements,
 * scheduled reminders.
 */
export async function handleProactiveMessage(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  ctx.logger.info('Proactive message request received');

  try {
    const { userKey, text } = (await req.data.json()) as {
      userKey: string;
      text: string;
    };

    // Validate input
    if (!userKey || !text) {
      ctx.logger.error('Missing required fields', { userKey, text });
      return resp.json(
        {
          error: 'Both userKey and text are required',
          example: { userKey: 'a1b2c3d4e5f6g7h8', text: 'Your message here' },
        },
        { status: 400 }
      );
    }

    // Load conversation reference
    const refResult = await ctx.kv.get('teams-chats', `ref-${userKey}`);

    if (!refResult.exists) {
      ctx.logger.warn('Conversation reference not found', { userKey });
      return resp.json(
        {
          error: 'Conversation reference not found',
          userKey,
          hint: 'Send a message to the bot in Teams to initialize the conversation reference, then retry.',
        },
        { status: 404 }
      );
    }

    const data =
      (await refResult.data.json()) as unknown as ConversationReferenceData;
    const { reference, fullUserId, userName } = data;

    // Verify botAppId is configured
    const botAppId = process.env.TEAMS_BOT_APP_ID;
    if (!botAppId) {
      ctx.logger.error('TEAMS_BOT_APP_ID not configured');
      return resp.json({ error: 'Bot configuration error' }, { status: 500 });
    }

    // Send proactive message using stored conversation reference
    await adapter.continueConversationAsync(
      botAppId,
      reference,
      async (turnContext: TurnContext) => {
        await turnContext.sendActivity(text);
      }
    );

    ctx.logger.info('Proactive message sent successfully', {
      userKey,
      fullUserId,
      userName,
      messageLength: text.length,
    });

    return resp.json({
      success: true,
      message: 'Proactive message sent',
      userKey,
      userName,
    });
  } catch (error) {
    const err = error as Error;

    // Handle user blocked/uninstalled bot
    if ('statusCode' in err && err.statusCode === 403) {
      ctx.logger.warn('User has blocked or uninstalled the bot', {
        error: err.message,
      });
      return resp.json(
        {
          error: 'User has blocked or uninstalled the bot',
          details: err.message,
        },
        { status: 403 }
      );
    }

    // Handle other errors
    ctx.logger.error('Failed to send proactive message', {
      error: err.message,
      stack: err.stack,
    });

    return resp.json(
      {
        error: 'Failed to send proactive message',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
