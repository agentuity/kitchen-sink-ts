# Discord Webhook Integration

## Setup Instructions

1. **Create a Discord Webhook**
   
   Right-click on the Discord channel where you want to receive notifications and select **Edit Channel**:
   
   ![Right-click context menu on Discord channel showing Edit Channel option](/.github/example-discord/discord-setup-1-edit-channel.png)
   
   Navigate to **Integrations** in the left sidebar, then click on **Webhooks**. You'll see the webhooks page:
   
   ![Discord Integrations page showing Webhooks section with Create Webhook button](/.github/example-discord/discord-setup-2-create-webhook.png)
   
   Click **Create Webhook** and configure your webhook:
   - Give it any name you like (this is just for your reference in Discord settings)
   - Select the channel for notifications
   - Click **Copy Webhook URL**
   
   > **Note**: The bot name that appears in Discord messages is set by the agent code as "Agentuity Agent", regardless of what you name the webhook here.
   
   ![Discord webhook configuration showing Copy Webhook URL button](/.github/example-discord/discord-setup-3-copy-url.png)

   > **Alternative Method**: You can also access webhooks via Server Settings → Integrations → Webhooks

2. **Configure Environment Variable**
   
   For local development, add to your `.env` file:
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
   ```
   
   For production deployment:
   ```bash
   agentuity env set --secret DISCORD_WEBHOOK_URL your-webhook-url-here
   ```

3. **Test the Integration**
   - Send JSON event data to your agent
   - Check your Discord channel for the sample notification

## What This Agent Does

This agent demonstrates Discord webhook message execution. It:

1. **Accepts JSON event data** and analyzes it with an AI model
2. **Creates rich Discord notifications** using embeds with custom styling
3. **Sends formatted messages** to your Discord channel via webhook

### Current Customizations

The agent currently sends messages with:
- **Custom username**: "Agentuity Agent"
- **Rich embed** with title, description, and AI-generated summary
- **Brand color**: Discord's blurple (`0x5865f2`)
- **Footer**: "Powered by Agentuity"
- **Timestamp**: Current time

### Sample Event Data

```json
{
  "type": "demo_published",
  "title": "How to Schedule Your AI Agents with Cron Jobs",
  "description": "Learn about scheduling agents with cron jobs",
  "url": "https://www.youtube.com/watch?v=__m9SnhJXVM",
  "platform": "YouTube"
}
```

## Discord Message Structure

When this agent sends data via webhook, Discord creates [Message Objects](https://discord.com/developers/docs/resources/message) with these auto-generated fields:

- `id` - Unique message identifier
- `channel_id` - Target channel ID
- `webhook_id` - Your webhook's ID
- `author` - Webhook user object (shows your custom username/avatar)
- `timestamp` - When the message was sent
- `type` - Message type (always `0` for simple webhook messages)

## Message Customization Options

You can modify the agent code to customize the webhook payload:

**Message Content:**
- `content` - Plain text message content (string)
- `embeds` - Array of embed objects for rich formatting (currently used by this agent)
- `tts` - Text-to-speech message (boolean)

**Webhook Overrides:**
- `username` - Override the webhook's default name
- `avatar_url` - Override the webhook's avatar

**Mentions (use these formats in `content` or embed descriptions):**
- `@everyone` or `@here` - Mention everyone/online users
- `<@user_id>` - Mention specific user (e.g., `<@123456789>`)
- `<@&role_id>` - Mention specific role (e.g., `<@&987654321>`)
- `<#channel_id>` - Link to channel (e.g., `<#456789123>`)
- `allowed_mentions` - Object to control which mentions trigger notifications
