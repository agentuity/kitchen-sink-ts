# Steps to create and configure the Telegram integration

## 1. Deploy and Get API Endpoint URL

Deploy the Kitchen Sink project to the Agentuity cloud:
```bash
agentuity deploy
```

Open the `example-telegram` agent in the [Agentuity web app](https://app.agentuity.com/). Click on the API IO, ensure it's set to `Public`, and copy the API endpoint URL:

![Agentuity agent showing API endpoint URL configuration](/.github/example-telegram/telegram-setup-1-api-endpoint.png)

## 2. Create Telegram Bot with BotFather

Open Telegram and start a conversation with [@BotFather](https://t.me/BotFather). This is the official bot for creating and managing Telegram bots:

![BotFather conversation showing available commands](/.github/example-telegram/telegram-setup-2-bot-father.png)

Send `/newbot` to create a new bot and follow the prompts to:
- **Choose a name** for your bot (this appears in contact details)
- **Choose a username** for your bot (must end in 'bot', e.g. `my_kitchen_sink_bot`)

BotFather will provide you with a **Bot Token**. Copy this token - you'll need it for the next step:

![BotFather providing bot token after successful creation](/.github/example-telegram/telegram-setup-3-token.png)

> **Important:** Keep your bot token secure and never share it publicly. Anyone with this token can control your bot.

## 3. Configure Environment Variables

Set the bot token in your Agentuity project:

For local development, add to your `.env` file:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
```

For production deployment:
```bash
agentuity env set --secret TELEGRAM_BOT_TOKEN your-bot-token-here
```

## 4. Set Up Webhook

Configure your bot to receive updates via webhook using the Telegram Bot API. You can do this with a simple HTTP request:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "YOUR_API_ENDPOINT_URL"}'
```

Replace:
- `<YOUR_BOT_TOKEN>` with your bot token from step 2
- `YOUR_API_ENDPOINT_URL` with the URL from step 1

You should receive a response like:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

> **Alternative:** You can also set the webhook programmatically or use tools like Postman for the API call.

## 5. Test Your Bot

Add your bot to a Telegram chat:

1. **Find your bot** by searching for its username in Telegram
2. **Start a conversation** by clicking "Start" or sending `/start`
3. **Send a message** and verify the bot responds with AI-generated replies

## What This Agent Does

This agent demonstrates Telegram bot integration with AI-powered conversations. It:

1. **Receives webhook updates** from Telegram when you send a message
2. **Maintains conversation history** using Agentuity's built-in KV storage (last 10 messages per chat)
3. **Generates AI responses** using OpenAI's GPT models with conversation context
4. **Sends replies** back to Telegram using the Bot API with proper message threading

### Supported Chat Types

The bot works in:
- **Private chats** - Direct messages with users
- **Group chats** - Public group conversations
- **Supergroups** - Large group conversations with topics support
- **Channels** - Broadcast channels (if added as admin)

## Technical Implementation

### Webhook Processing

Telegram sends webhook payloads as [Update objects](https://core.telegram.org/bots/api#update), which contain:
- `update_id` - Unique update identifier
- `message` - Message object with text, sender info, and chat details
- Additional fields for other update types (edited messages, inline queries, etc.)

### API Integration

The agent uses Telegram's [sendMessage](https://core.telegram.org/bots/api#sendmessage) method with:
- **Modern reply format**: `reply_parameters: { message_id }`
- **Plain text messages**: No `parse_mode` to avoid API errors from unescaped special characters in AI-generated content
- **Error handling**: Proper API error response handling

## Rate Limits and Best Practices

### Telegram Rate Limits
- **1 message per second** per chat
- **20 messages per minute** per group
- **30 messages per second** globally for bulk sends

### Best Practices
- Always return `200 OK` from webhook endpoints
- Process messages asynchronously to avoid webhook timeouts
- Filter bot messages to prevent infinite loops
