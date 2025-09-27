import type { AgentContext } from '@agentuity/sdk';

// Minimal type definitions
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  message_thread_id?: number; // For supergroups with topics
  date: number;
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  text?: string;
  reply_to_message?: TelegramMessage; // For handling reply chains
}

// Send message via Telegram Bot API
export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  ctx: AgentContext,
  replyToMessageId?: number
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      // Use ReplyParameters (with backward compatibility)
      ...(replyToMessageId && {
        reply_parameters: { message_id: replyToMessageId },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    ctx.logger.error('Telegram API error:', error);
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}
