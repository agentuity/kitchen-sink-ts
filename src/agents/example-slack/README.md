# Steps to create and configure the Slack integration

1. Deploy your Slack agent to the Agentuity cloud `agentuity deploy`
2. Open the agent in the Agentuity web app, click on the API IO, ensure it's set to `Public`, and get the API endpoint URL
3. Edit the `.slack.manifest` file to replace the placeholder values
4. Create a new Slack app at https://api.slack.com/apps, choose `From manifest` and paste in your finalized manifest (which you can now delete)
	a. Add an avatar, description, etc, whatever you want in the Slack app settings
	b. Change any events you want to listen for; by default, the app can listen for @ mentions and respond in the thread, but you can enable the ability to DM the app, listen for reactions, etc.
5. In your Slack app, go to "Basic Information" to get your "Signing Secret" and set it: `agentuity env set --secret SLACK_SIGNING_SECRET your-signing-secret-here`
6. In your Slack app, go to "OAuth & Permissions" to get your "Bot User OAuth Token" and set it: `agentuity env set --secret SLACK_BOT_TOKEN xoxb-your-bot-token-here`
7. Add your Slackbot to a channel, then send it a message by mentioning the bot; you're done!