<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

# Agentuity Kitchen Sink: An Interactive SDK Showcase

**Try out every Agentuity feature through live, interactive agents.**

Test drive the complete Agentuity SDK in minutes — no docs required!

## What is the Kitchen Sink?

The Kitchen Sink is an interactive playground and reference implementation where you can:

- **See Agentuity features in action** with real, working code
- **Test SDK capabilities hands-on** before building your own agents
- **Learn by example** since each agent demonstrates specific features
- **Use as a reference implementation** for your own projects

### Key Benefits

- **Interactive Learning**: Send messages to agents and see exactly how features work
- **Code-Along Experience**: Have the source code open while testing to understand implementation
- **Zero to Running in a Few Minutes**: Minimal setup to start exploring
- **Living Documentation**: The agents themselves explain their features

## Quick Start

1. **Deploy to your account** using the "*Deploy w/ Agentuity*" button at the top of this README. You'll have the option to copy the Kitchen Sink project to a public or private GitHub repository.
2. **Customize agents** or add new ones in `src/agents/`.
3. **Test locally** with `agentuity dev`.
4. **Deploy your changes** with `agentuity deploy`
5. **Set any required secrets** (if needed)
```bash
agentuity env set --secret OPENAI_API_KEY your-key-here
```

After you deploy, follow the link shown in your terminal to launch DevMode in your browser. Select any agent and start exploring!

## Prerequisites

### Required

- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install with `npm install -g @agentuity/cli`
- **Agentuity account**: Sign up at [agentuity.com](https://app.agentuity.com/sign-up)

### Optional

These are only needed for specific agent demonstrations:

- **Object Storage bucket**: Only required for the "Object Store" agent demo. Create via the Agentuity Console from the *Infrastructure* section.
- **`OPENAI_API_KEY`**: Only required for the "Bring-Your-Own-Token" agent demo. Set in your `.env` file locally.
- **`COMPOSIO_API_KEY`**: Only required for the "Composio" agent demo. Sign up at [composio.dev](https://composio.dev/) to access hundreds of tool integrations. Set in your `.env` file locally.
- **`DISCORD_WEBHOOK_URL`**: Only required for the "Discord" agent demo. Create a Discord webhook URL in your server's channel settings. Set in your `.env` file locally.
- **`SLACK_SIGNING_SECRET`** and **`SLACK_BOT_TOKEN`**: Only required for the "Slack" agent demo. Create a Slack app with bot permissions and install it in your workspace. Set in your `.env` file locally.
- **Twilio phone number**: Only required for the "SMS IO" agent demo. Requires a Twilio account with a verified phone number (not included in free trials).

**Note**: Most agents work without this additional setup. For agents requiring setup, see their individual READMEs for detailed instructions.

## Available Agents

Each agent demonstrates specific Agentuity features. Here's what you can explore:

| Agent | What It Demonstrates |
|:------|:---------------------|
| **kitchen-sink** | Ask questions about any Agentuity feature |
| **handler-request** | Access request data, content types, and triggers |
| **handler-response** | Different response formats (text, images, streams, etc.) |
| **handler-context** | Session data and agent context access |
| **frameworks-provider** | Run multiple AI frameworks side-by-side |
| **gateway-provider** | AI Gateway with multiple LLM providers |
| **gateway-byo-token** | Using your own LLM provider API keys |
| **io-agent** | Agent-to-agent communication & handoffs |
| **io-api** | Synchronous API request handling |
| **io-cron** | Scheduled execution with cron triggers |
| **io-email** | Receive and respond to emails |
| **io-sms** | SMS messaging via Twilio |
| **io-webhook** | Asynchronous webhook processing (fire-and-forget) |
| **storage-key-value** | Fast KV storage for session state & caching |
| **storage-object-store** | Store files, images, and large objects |
| **storage-vector** | Semantic search with vector embeddings |
| **observability-logging** | Structured logging at different levels |
| **observability-tracing** | OpenTelemetry tracing with spans and events |
| **example-chat** | Conversational AI with persistent chat history |
| **example-composio** | Integration with Composio tools (Hacker News) |
| **example-discord** | Discord webhook notifications |
| **example-slack** | Slack bot integration with thread support |

## How to Use in DevMode

### Getting Help

Run a simple "help" command (from any agent besides the `example-*` agents) for an overview of each feature. To ask specific questions about Agentuity features, use the `kitchen-sink` agent.

### Following Along

We recommend you try out an agent in DevMode while keeping the source code open in `src/agents/[agent-name]`, to see exactly how each feature is implemented.

### Understanding Responses

Each agent explains what it's doing as it runs, making it easy to understand the SDK features in action.

### Interactive Prompts

Most of these agents (aside from the `example-*` agents) suggests prompts when you first select it — just click to try them!

## Project Structure

```text
kitchen-sink-ts/
├── src/
│   ├── agents/        # Agent implementations
│   └── lib/           # Shared utilities
├── node_modules/      # Dependencies
├── package.json       # Project dependencies and scripts
├── agentuity.yaml     # Agentuity project configuration
└── .env               # Local environment variables
```

## Resources

- **Documentation**: [agentuity.dev](https://agentuity.dev)
- **JavaScript SDK Reference**: [JavaScript SDK](https://agentuity.dev/SDKs/javascript)
- **Python SDK Reference**: [Python SDK](https://agentuity.dev/SDKs/python)
- **Discord Community**: [Join our Discord](https://discord.gg/agentuity)

## License

This project is licensed under the terms specified in the LICENSE file.
