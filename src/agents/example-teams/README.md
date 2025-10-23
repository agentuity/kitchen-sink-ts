# Microsoft Teams Bot Setup Guide

Complete guide to building and deploying a Teams bot using Agentuity.

## Overview

This example demonstrates:
- **Serverless Teams bot** using CloudAdapter and `processActivityDirect`
- **AI conversations** with context retention (last 10 messages)
- **KV storage** for conversation history
- **Zod validation** for fail-fast error handling
- **Azure Bot Service integration** without running your own HTTP server

**Related Example:** This agent uses many of the same patterns as the `example-chat` agent (KV storage, message history, AI context), but adapted for Microsoft Teams.

## Prerequisites

- Microsoft Azure account
- Microsoft Teams account
- Agentuity account and CLI installed
- Basic understanding of Teams bots and Bot Framework

## Architecture Overview

This agent uses two files:

- **`teams.ts`** - Platform-specific Teams configuration ([CloudAdapter](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bot.builder.integration.aspnet.core.cloudadapter?view=botbuilder-dotnet-stable), authentication, schemas)
- **`index.ts`** - Agent implementation (request handling, AI logic, KV storage)

**How this differs from Microsoft samples:** Most [Microsoft examples](https://github.com/microsoft/BotBuilder-Samples/blob/55d1f5372ee811e1fb8c0ccb15cc86340cc15679/samples/javascript_nodejs/80.skills-simple-bot-to-bot/echo-skill-bot/index.js) use `adapter.process(req, res, callback)` which expects Node.js HTTP objects and controls the response. Agentuity uses `adapter.processActivityDirect(authHeader, activity, callback)` instead - a serverless-friendly method that lets you control the response while still getting full Bot Framework features (JWT validation, TurnContext, ConnectorClient, etc.).

## Part 1: Azure Bot Service Setup

### 1.1 Create Azure Bot Resource

1. Go to [Azure Portal](https://portal.azure.com)

![Azure Portal home page with Create a resource button](/.github/example-teams/teams-setup-1-azure-home.png)

2. Click **Create a resource** → **Categories** → **AI Apps and Agents**

![Azure Portal showing AI Apps and Agents category](/.github/example-teams/teams-setup-2-categories.png)

3. Find **Azure Bot** and click **Create**

![Azure Bot resource creation page](/.github/example-teams/teams-setup-3-create-bot.png)

**Configuration:**
- **Bot handle**: Choose unique name (e.g., `my-agentuity-bot`)
- **Subscription**: Select your subscription
- **Resource group**: Create new or use existing
- **Data residency**: Global (recommended)
- **Pricing tier**: Standard (default) - You can change to F0 (Free) after creation if needed
- **Type of App**: Single Tenant
- **Creation type**: Create new Microsoft App ID

4. Click **Review + Create** → **Create**

### 1.2 Get Bot Credentials

After creation completes:

1. Go to your bot resource
2. Navigate to **Configuration** (left sidebar)
3. Copy these values:

```
Microsoft App ID: <copy this - it's your TEAMS_BOT_APP_ID>
Microsoft App Tenant ID: <copy this - it's your TEAMS_BOT_TENANT_ID>
```

4. Click **Manage** next to "Microsoft App ID"
5. Go to **Certificates & secrets** → **Client secrets** → **New client secret**
6. Add description (e.g., "Agentuity bot secret")
7. Select expiration
8. Click **Add**
9. **Copy the secret value immediately** (you won't see it again)

```
Client secret value: <copy this - it's your TEAMS_BOT_APP_PASSWORD>
```

![Azure App Registration showing client secret configuration](/.github/example-teams/teams-setup-4-bot-credentials.png)

### 1.3 Enable Teams Channel

1. In your bot resource, go to **Channels** (left sidebar)
2. Click the **Microsoft Teams** icon under "Available channels"
3. Review the settings and keep the default (Messaging: Commercial)
4. Click **Apply**

**Verification:** The Teams channel should now appear in "Connected channels" with "Healthy" status.

![Azure Bot channels page showing Microsoft Teams and Web Chat with Healthy status](/.github/example-teams/teams-setup-5-channels.png)

![Microsoft Teams channel configuration showing messaging settings](/.github/example-teams/teams-setup-6-channels-details.png)

**Note:** Web Chat and Direct Line channels are enabled by default - you can use Web Chat for testing (see [Part 3.4](#34-test-your-bot-optional-but-recommended)). The messaging endpoint will be configured in [Part 3.3](#33-configure-messaging-endpoint) after deploying to Agentuity.

## Part 2: Environment Variables Setup

### 2.1 Create .env File

In your project root, create/update `.env`:

```bash
# Azure Bot Service credentials
TEAMS_BOT_APP_ID=<Microsoft App ID from step 1.2>
TEAMS_BOT_APP_PASSWORD=<Client secret value from step 1.2>
TEAMS_BOT_TENANT_ID=<Microsoft App Tenant ID from step 1.2>
```

### 2.2 Configure in Agentuity

Add environment variables to your Agentuity project:

```bash
# Using Agentuity CLI
agentuity env set TEAMS_BOT_APP_ID "your-app-id"
agentuity env set TEAMS_BOT_APP_PASSWORD "your-password"
agentuity env set TEAMS_BOT_TENANT_ID "your-tenant-id"
```

Or view/set them in the Agentuity dashboard under your project's **Settings** tab.

## Part 3: Deploy to Agentuity

### 3.1 Deploy the Agent/Project

```bash
# From project root
agentuity deploy
```

### 3.2 Get Webhook URL

After deployment:

1. Go to Agentuity dashboard
2. Navigate to your project → Agents → `example-teams`
3. Copy the webhook URL
4. Format: `https://api.agentuity.com/webhooks/agent/<agent-id>`

### 3.3 Configure Messaging Endpoint

Now that you have your webhook URL, configure it in Azure:

1. **Configuration** → **Messaging endpoint**
2. Paste your Agentuity webhook URL
3. Click **Save**

![Azure Bot Configuration page showing messaging endpoint field](/.github/example-teams/teams-setup-7-messaging-endpoint.png)

**Verification:**
- Azure will send a test message to verify the endpoint
- Check Agentuity logs to confirm the bot received it
- If successful, you'll see "Teams bot request received" in logs

### 3.4 Test Your Bot (Optional but Recommended)

Before creating the Teams manifest, you can test your bot in Azure's Web Chat to verify everything works:

1. In your Azure Bot resource, click **Test in Web Chat** (left sidebar)
2. The chat interface will open automatically
3. Send a message (e.g., "Hello") to test the bot

**What to expect:**
- Welcome message appears automatically
- Bot responds to your messages with AI-generated replies
- Conversation context is maintained (try asking "What did I ask earlier?")

![Azure Bot Test in Web Chat showing conversation with AI bot](/.github/example-teams/teams-setup-8-test-webchat.png)

**Why test here first:**
- Verify your bot logic works before Teams setup
- Faster iteration (no manifest creation needed)
- Same Bot Framework integration as Teams
- Useful for debugging

**Note:** Web Chat is automatically enabled for all Azure Bots. If you see errors, check:
- Agentuity webhook URL is correct in Configuration
- Environment variables are set in Agentuity
- Bot is deployed to Agentuity

## Part 4: Create Teams App Manifest

### 4.1 Prepare Icons

This example includes placeholder icons in `src/agents/test-agent/appManifest/`. You can use these to get started quickly, or replace them with your own branding:

**color.png:**
- The icon for the bot (shown in Teams app list, chat header, etc.)
- Dimensions: 192x192 pixels
- Full color logo/icon
- File size: < 100KB recommended

**outline.png:**
- Dimensions: 32x32 pixels
- **Transparent background** (Alpha=0 for background pixels)
- **White foreground only** (RGB: 255,255,255, Alpha=255)
- No anti-aliasing or semi-transparent pixels

**To customize:** Replace the placeholder icons with your own branding, ensuring they meet the requirements above.

**Note:** Teams is very strict about outline.png transparency. Ensure the background is fully transparent with only white foreground pixels.

### 4.2 Configure manifest.json

Edit `src/agents/test-agent/appManifest/manifest.json`:

**Required changes:**
1. Replace `{MICROSOFT_APP_ID}` with your actual App ID (appears in 2 places: `id` and `bots[0].botId`)
2. Update `name.short` and `name.full` (optional)
3. Update `description.short` and `description.full` (optional)
4. Update `developer.name`, `developer.websiteUrl`, `developer.privacyUrl`, `developer.termsOfUseUrl`

**Note:** Teams requires all URLs in the manifest to be valid HTTPS URLs. Use placeholder URLs (like `https://example.com/privacy`) during development if you don't have real URLs yet. You can update these later before publishing to your organization.

### 4.3 Create Manifest Package

```bash
cd src/agents/test-agent/appManifest
zip -r manifest.zip manifest.json color.png outline.png
```

Verify the zip contains exactly 3 files:
```bash
unzip -l manifest.zip
# Should show:
#   manifest.json
#   color.png
#   outline.png
```

### 4.4 Validate Manifest (Recommended)

Before installing in Teams, validate your manifest:

1. Go to [Teams Developer Portal](https://dev.teams.microsoft.com/home)
2. Click **New app** → **Import app**

![Teams Developer Portal import app dialog](/.github/example-teams/teams-setup-9-validate-manifest.png)

3. Upload `manifest.zip`
4. Check for validation errors - if successful, you'll see no errors and can proceed

**Common errors:**
- **"Outline icon is not transparent"**: Fix outline.png (see [Part 4.1](#41-prepare-icons))
- **"Invalid App ID"**: Ensure App ID matches Azure Bot registration
- **"Invalid URLs"**: Ensure all URLs are HTTPS and accessible

If validation fails, fix the issues, re-create `manifest.zip`, and validate again.

## Part 5: Install in Microsoft Teams

### 5.1 Upload Custom App

**Option A: Direct Upload (Easiest)**
1. Open Microsoft Teams (desktop app or [web version](https://teams.microsoft.com/v2/))
2. Click **Apps** (left sidebar)
3. Click **Manage your apps** (bottom left)
4. Click **Upload an app** → **Upload a custom app**
5. Select `manifest.zip`
6. Click **Add**

![Microsoft Teams upload custom app dialog](/.github/example-teams/teams-setup-11-teams-upload.png)

**Option B: Via Developer Portal**
1. In Developer Portal, after importing app
2. Click **Publish** → **Publish to org** (requires admin approval)
3. Or click **Download** to get manifest.zip and use Option A

### 5.2 Start Chatting

1. Find your bot in Teams Apps
2. Click **Chat** to start 1:1 conversation
3. Bot should send welcome message:
   ```
   Hello! I'm an AI assistant. Send me a message and I'll help you with anything you need!
   ```

## Part 6: Testing

### 6.1 Basic Functionality Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Welcome message** | Add bot to chat | Welcome message appears automatically |
| **AI conversation** | 1. Send: "What should I eat for dinner?"<br>2. Send: "Make it vegetarian" | Bot provides suggestions and remembers context |
| **Conversation history** | 1. Send several messages<br>2. Ask: "What did I ask earlier?" | Bot references previous conversation |
| **Context limits** | Send 10+ messages | Bot continues responding (keeps last 10 messages) |

### 6.2 Check Agentuity Logs

Monitor logs in Agentuity dashboard:

```
Teams bot request received
Processing activity { type: 'message', id: '...', from: 'John Doe' }
Bot logic executing { activityType: 'message' }
AI response sent { userId: '...', messageCount: 6 }
Request processed successfully
```

**Expected logs per message:**
1. "Teams bot request received"
2. "Processing activity"
3. "Bot logic executing"
4. "AI response sent" (with message count)
5. "Request processed successfully"

### 6.3 Verify KV Storage

In Agentuity dashboard, check Key-Value storage:

**Bucket:** `teams-chats`
**Keys:**
- `chat-<hashed-user-id>` - Conversation history (24h TTL)
- `ref-<hashed-user-id>` - Conversation reference for proactive messaging (30d TTL)

**Content:** Array of messages with role, content, timestamp

![Agentuity Key-Value storage showing Teams chat history](/.github/example-teams/teams-setup-12-kv-storage.png)

## Part 7: Proactive Messaging

After chatting with the bot, you can send yourself (or others) messages proactively via webhook/curl - without initiating a conversation first. This is useful for:
- Cron-triggered notifications
- Event-driven alerts
- Scheduled reminders
- System announcements

For more details on proactive messaging patterns, see Microsoft's [Send proactive messages guide](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=javascript).

### 7.1 How It Works

When you send your first message to the bot, the system automatically:
1. Stores a conversation reference in KV storage
2. Logs your `userKey` (short 16-character hash)
3. Keeps this reference for 30 days

You can then use this `userKey` to send proactive messages via the same webhook URL.

### 7.2 Getting Your User Key

**Method 1: Check Logs (Easiest)**

After chatting with the bot, check your Agentuity logs for:

```
Conversation reference stored {
  userName: 'John Doe',
  userKey: 'YOUR_USER_KEY',    ← Copy this!
  fullUserId: '29:1-...',
  note: 'Use userKey in curl commands for proactive messaging'
}
```

**Method 2: Check KV Storage**

1. Go to Agentuity dashboard → Key-Value Storage
2. Select bucket: `teams-chats`
3. Find key: `ref-<something>` (e.g., `ref-YOUR_USER_KEY`)
4. The suffix after `ref-` is your `userKey`
5. Open the value to see the full conversation reference data

### 7.3 Send a Proactive Message

**Step-by-step:**

1. **Chat with the bot in Teams**
   - Send any message (e.g., "Hello")
   - Bot responds with AI-generated reply

2. **Find your userKey**
   - Check Agentuity logs → Look for "Conversation reference stored"
   - Copy the `userKey` value

3. **Send the proactive message**
   ```bash
   curl https://api.agentuity.com/webhooks/agent/<your-agent-id> \
     -X POST \
     -H 'Content-Type: application/json' \
     -d '{"userKey": "YOUR_USER_KEY", "text": "Testing proactive messaging!"}'
   ```

4. **Verify in Teams**
   - Message should appear in your chat with the bot
   - No action required - it's truly proactive!

**Parameters:**
- `userKey` (required): The 16-character hash from logs or KV storage
- `text` (required): The message to send

**Success response:**
```json
{
  "success": true,
  "message": "Proactive message sent",
  "userKey": "YOUR_USER_KEY",
  "userName": "John Doe"
}
```

**Common errors:**

**Not found (404):**
```json
{
  "error": "Conversation reference not found",
  "userKey": "YOUR_USER_KEY",
  "hint": "Send a message to the bot in Teams to initialize the conversation reference, then retry."
}
```

**Missing parameters (400):**
```json
{
  "error": "Both userKey and text are required",
  "example": {
    "userKey": "a1b2c3d4e5f6g7h8",
    "text": "Your message here"
  }
}
```

**Blocked (403):**
```json
{
  "error": "User has blocked or uninstalled the bot",
  "details": "..."
}
```

### 7.4 Use Cases

**Cron-triggered notifications:**

Set up scheduled messages using Agentuity's cron feature (configured in the dashboard):
- Daily reminders (e.g., "9 AM standup reminder")
- Weekly summaries (e.g., "Friday EOD report")
- Custom schedules (e.g., "Every 2 hours during business hours")

In your cron agent, use the proactive messaging pattern from [Part 7.3](#73-send-a-proactive-message) to send messages to specific people.

**Event-driven alerts:**
```javascript
// When a system event occurs
await fetch('https://api.agentuity.com/webhooks/agent/<agent-id>', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userKey: 'USER_KEY',
    text: 'Alert: Your deployment completed successfully!'
  })
});
```

## Part 8: Troubleshooting

**Tip:** If you encounter errors that are difficult to diagnose, check your bot's health status in the Azure Portal. Navigate to your bot resource → **Settings → Channels** and review the **Health Status** column for your Teams channel (or Web Chat channel if testing there). Error details and logs will appear here when there are connection or configuration issues. In most cases, though, you can see helpful agent logs in the Agentuity Console under **Projects → Logs**.

| Problem | Solution |
|---------|----------|
| **Bot not responding** | 1. Verify Azure messaging endpoint matches Agentuity webhook URL<br>2. Check environment variables are set correctly in Agentuity<br>3. Review Agentuity logs for errors (auth header, activity structure, credentials)<br>4. Confirm Teams channel is enabled in Azure Bot (should show "Running") |
| **Manifest upload fails: "Outline icon not transparent"** | Fix outline.png to use fully transparent background with white foreground only (see [Part 4.1](#41-prepare-icons)), re-create manifest.zip, and try again |
| **Manifest upload fails: "App ID mismatch"** | Ensure `manifest.json` fields `id` and `bots[0].botId` both exactly match your Azure Bot App ID (case-sensitive) |
| **Manifest upload fails: "Invalid URLs"** | Ensure all URLs in manifest are HTTPS and publicly accessible (or use placeholder URLs for testing) |
| **Bot works in Web Chat but not Teams** | Verify App ID in manifest.json exactly matches Azure Bot in both the `id` field and `bots[0].botId` field. Re-zip and re-upload if needed. |
| **Signing Key errors in logs** | Usually transient - retry the request. If persistent, verify Azure Bot credentials are correct and check network connectivity. |
| **Welcome message not showing** | Welcome message only appears when bot is first added to chat or new member joins. To trigger again: remove bot from Teams and re-add it. |

## Next Steps

### Broadcasting to Multiple People

The proactive messaging example in [Part 7](#part-7-proactive-messaging) sends to one person. To broadcast announcements to everyone, iterate through stored conversation references:

```typescript
// Get all stored conversation references
const refs = await ctx.kv.list('teams-chats');

for (const key of refs.keys) {
  // Skip non-reference keys (chat history keys)
  if (!key.startsWith('ref-')) continue;

  const refResult = await ctx.kv.get('teams-chats', key);
  const data = await refResult.data.json() as ConversationReferenceData;

  try {
    await adapter.continueConversationAsync(
      process.env.TEAMS_BOT_APP_ID!,
      data.reference,
      async (context) => {
        await context.sendActivity('Your announcement here');
      }
    );
  } catch (error) {
    ctx.logger.error('Failed to send to user', { key, error });
  }
}
```

**Note:** Implement rate limiting and error handling to avoid hitting Teams API limits.

### Extend Functionality

Ideas for enhancing your bot:
- Add slash commands (`/help`, `/reset`)
- Integrate with external APIs
- Add adaptive cards for rich responses
- Multi-user conversation support (group chats)
- Persistent user preferences

## Resources

### Microsoft Documentation
- [Microsoft Teams Bot Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/what-are-bots)
- [Send Proactive Messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=javascript)
- [Teams App Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Azure Bot Service](https://azure.microsoft.com/en-us/products/ai-services/ai-bot-service)

### Bot Framework SDK
- [Bot Framework SDK (GitHub)](https://github.com/microsoft/botbuilder-js)
- [CloudAdapter Class](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bot.builder.integration.aspnet.core.cloudadapter?view=botbuilder-dotnet-stable)
- [BotFrameworkAuthentication Class](https://learn.microsoft.com/en-us/javascript/api/botframework-connector/botframeworkauthentication?view=botbuilder-ts-latest)

### Sample Code
- [Teams Conversation Bot Sample (Node.js)](https://github.com/OfficeDev/Microsoft-Teams-Samples/tree/main/samples/bot-conversation/nodejs) - Simple conversation bot similar to this example

### Agentuity
- [Agentuity Documentation](https://agentuity.dev/)
