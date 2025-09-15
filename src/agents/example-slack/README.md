# Steps to create and configure the Slack integration

## 1. Deploy and Get API Endpoint URL

Deploy your Slack agent to the Agentuity cloud:
```bash
agentuity deploy
```

Open the agent in the [Agentuity web app](https://app.agentuity.com/). Click on the API IO, ensure it's set to `Public`, and copy the API endpoint URL:

![Agentuity agent showing API endpoint URL configuration](/.github/example-slack/slack-setup-1-api-endpoint.png)

## 2. Configure Manifest

Edit the `.slack.manifest` file to:
- Replace `YOUR_API_ENDPOINT_URL` with the URL from step 1
- Update the app name and bot display name

## 3. Create Slack App

Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App**. Choose **From a manifest**:

![Slack app creation dialog showing From a manifest option](/.github/example-slack/slack-setup-2-create-app.png)

Select the workspace where you want to install the app:

![Slack workspace selection dialog](/.github/example-slack/slack-setup-3-workspace.png)

Paste your configured manifest into the dialog:

![Slack manifest configuration with Example Agent details](/.github/example-slack/slack-setup-4-manifest.png)

> **Note**: After creating the app, you can delete the `.slack.manifest` file if desired.

## 4. Get App Credentials

In your Slack app settings, go to **Basic Information** to get your **Signing Secret**:

![Slack app Basic Information page showing Signing Secret](/.github/example-slack/slack-setup-5-app-info.png)

Set the signing secret in your Agentuity project:
```bash
agentuity env set --secret SLACK_SIGNING_SECRET your-signing-secret-here
```

## 5. Install App and Get OAuth Token

Navigate to **OAuth & Permissions** in your Slack app settings. If you haven't installed the app yet, you'll see an "Install to Workspace" button. Click it to install the app to your workspace.

Once installed, your **Bot User OAuth Token** will be automatically generated:

![Slack OAuth & Permissions page showing Bot User OAuth Token](/.github/example-slack/slack-setup-6-oauth.png)

Copy the token and set it:
```bash
agentuity env set --secret SLACK_BOT_TOKEN xoxb-your-bot-token-here
```

## 6. Test Your Bot

Add your Slackbot to a channel, then send it a message by mentioning the bot (@Example Agent). You're done!

## Optional Configuration

- **Avatar & Description**: Add these in the Slack app settings for a more polished appearance
- **Event Subscriptions**: The default configuration listens for @ mentions. You can enable DMs, reactions, and other events in the Event Subscriptions settings