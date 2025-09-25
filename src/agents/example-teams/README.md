# Microsoft Teams Example Agent

This agent demonstrates Microsoft Teams bot integration using the Agentuity SDK and the Microsoft Bot Framework.

## How It Works

The agent uses `req.data.teams()` to access Teams-specific functionality.

## Testing

This agent only works with actual Teams webhooks. Testing is not available in DevMode.

To test:
1. Set up Azure Bot Service (see setup guide - coming soon)
2. Add bot to Teams channel
3. Send messages to the agent
4. Receive replies back from the agent
