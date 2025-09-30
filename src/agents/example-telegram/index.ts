import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { sendTelegramMessage, type TelegramUpdate } from './telegram';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  // No manual trigger handling
  if (req.trigger === 'manual') {
    return resp.text('This agent only responds to Telegram triggers.');
  }

  // Parse webhook update
  const update = await req.data.object<TelegramUpdate>();

  // Filter non-text messages and bot messages
  if (!update?.message?.text || update.message.from?.is_bot) {
    return resp.text('OK');
  }

  // Fast 200 OK response
  const response = resp.text('OK');

  // Async processing: get chat history, generate AI response, send reply
  (async () => {
    if (!update.message) return;

    const chatId = update.message.chat.id;
    const chatKey = `telegram-chat-${chatId}`;

    // Get conversation history from KV
    type MessageHistory = Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;

    let messages: MessageHistory = [];

    try {
      const historyResult = await ctx.kv.get('kitchen-sink', chatKey);

      if (historyResult.exists) {
        messages = (await historyResult.data.json()) as MessageHistory;
      }
    } catch (error) {
      ctx.logger.error('Error retrieving chat history:', error);
    }

    // Add new message to history
    messages.push({
      role: 'user',
      content: update.message.text!,
      timestamp: update.message.date, // Unix timestamp from Telegram API
    });

    // Keep last 10 messages
    if (messages.length > 10) {
      messages.splice(0, messages.length - 10);
    }

    // Store updated history
    await ctx.kv.set('kitchen-sink', chatKey, messages, { ttl: 86400 });

    // Generate AI response
    const result = await generateText({
      model: openai('gpt-5-mini'),
      system:
        'You are a helpful Telegram bot assistant. Keep responses concise and friendly.',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    // Validate bot token
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
    }

    // Send reply
    await sendTelegramMessage(
      token,
      chatId,
      result.text,
      ctx,
      update.message.message_id
    );

    // Add bot response to history
    messages.push({
      role: 'assistant',
      content: result.text,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp to match Telegram API format
    });
    await ctx.kv.set('kitchen-sink', chatKey, messages, { ttl: 86400 });
  })().catch((error) => {
    ctx.logger.error('Async processing error:', error);
  });

  return response;
}

export const welcome = () => ({
  welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Telegram</span> example agent.\n\n### About\n\nThis agent demonstrates how to create a Telegram bot that can have AI-powered conversations using webhooks.\n\n### Testing\n\nTesting is not available in DevMode for this agent. Add your bot to a Telegram chat to test.\n\n### Questions?\n\nThe "Help" command is not available for this agent, as it's a platform-specific example.`,
  prompts: [],
});
