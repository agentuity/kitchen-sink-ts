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

1. **Clone & Install**
```bash
git clone https://github.com/agentuity/kitchen-sink-ts.git
cd kitchen-sink-ts
bun install
```

2. **Authenticate**
```bash
agentuity login
```

3. **Launch DevMode**
```bash
agentuity dev
```

Follow the link shown in your terminal to launch DevMode in your browser. Select any agent and start exploring!

## Prerequisites

### Required
- **Bun**: Version 1.2.4 or higher
- **Agentuity CLI**: Install with `npm install -g @agentuity/cli`
- **Agentuity account**: Sign up at [agentuity.com](https://app.agentuity.com/sign-up)

### Optional
These are only needed for specific agent demonstrations:
- **OPENAI_API_KEY**: Only required for the "Bring-Your-Own-Token" agent demo. Set in your `.env` file locally.
- **Object Storage bucket**: Only required for the "Object Store" agent demo. Create via the Agentuity Console from the *Infrastructure* section.

**Note**: Most agents work without any additional setup.

## Available Agents

Each agent demonstrates specific Agentuity features. Here's what you can explore:

| Agent | What It Demonstrates | Try This First |
|-------|---------------------|----------------|
| **kitchen-sink** | Ask questions about any Agentuity feature | "What can you do?" |
| **storage-key-value** | Fast KV storage for session state & caching | "Hello, world!" |
| **storage-object-store** | Store files, images, and large objects | "Plain-Text" |
| **io-agent** | Agent-to-agent communication & handoffs | "Handoff" |
| **gateway-provider** | AI Gateway with multiple LLM providers | "Tell me a story" |
| **gateway-byo-token** | Using your own API keys | "Tell me a story" |
| **frameworks-provider** | Run multiple AI frameworks side-by-side | "Tell me a story" |

## How to Use in DevMode

### Getting Help
Run a simple "help" command from any agent for an overview of each feature. To ask specific questions about Agentuity features, use the `kitchen-sink` agent.

### Following Along
We recommend you try out an agent in DevMode while keeping the source code open in `src/agents/[agent-name]`, to see exactly how each feature is implemented.

### Understanding Responses
Each agent explains what it's doing as it runs, making it easy to understand the SDK features in action.

### Interactive Prompts
Each agent suggests prompts when you first select it — just click to try them!

## Fork & Deploy Your Own

Ready to customize the Kitchen Sink or use it as a starting point? Here's how to get started:

1. **Fork the repository** on GitHub
2. **Clone your fork**
```bash
git clone https://github.com/YOUR-USERNAME/kitchen-sink-ts.git
cd kitchen-sink-ts
```
3. **Customize agents** or add new ones in `src/agents/`.
4. **Test locally** with `agentuity dev`.
5. **Deploy to Agentuity Cloud**
```bash
agentuity deploy
```
6. **Set any required secrets** (if needed)
```bash
agentuity env set --secret OPENAI_API_KEY your-key-here
```

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
