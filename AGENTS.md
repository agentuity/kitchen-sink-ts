# Agentuity JavaScript/TypeScript Agent Development

This guide provides comprehensive instructions for developing AI agents using the Agentuity platform with JavaScript and TypeScript.

## 1. Agent Development Guidelines

- Prefer using the `agentuity agent create` command to create a new Agent
- Prefer loading types from the node modules package `@agentuity/sdk` in the node_modules folder
- The file should export a default function
- Prefer naming the default function Agent or the name of the Agent based on the context of the Agent description
- All code should be in TypeScript format
- Use the provided logger from the `AgentContext` interface such as `ctx.logger.info("my message: %s", "hello")`

### Example Agent File

```typescript
import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(req: AgentRequest, resp: AgentResponse, ctx: AgentContext) {
	return resp.json({hello: 'world'});
}
```

## 2. Core Interfaces

### AgentHandler

The main handler function type for an agent:

```typescript
type AgentHandler = (
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) => Promise<AgentResponseType>;
```

### AgentRequest

The `AgentRequest` interface provides methods for accessing request data:

- `request.trigger`: Gets the trigger type of the request
- `request.metadata(key, defaultValue)`: Gets metadata associated with the request
- `request.get(key, defaultValue)`: Gets the metadata value of the request
- `request.data.contentType`: Gets the content type of the request payload
- `request.data.json(): Promise<Json>`: Gets the payload as a JSON object
- `request.data.text(): Promise<string>`: Gets the payload as a string
- `request.data.buffer(): Promise<ArrayBuffer>`: Gets the payload as a ArrayBuffer
- `request.data.binary(): Promise<ArrayBuffer>`: Gets the payload as a ArrayBuffer
- `request.data.object<T>: Promise<T>`: Gets the payload as a typed object

### AgentResponse

The `AgentResponse` interface provides methods for creating responses:

- `response.json(data, metadata)`: Creates a JSON response
- `response.text(data, metadata)`: Creates a text response
- `response.binary(data, metadata)`: Creates a binary response
- `response.html(data, metadata)`: Creates an HTML response
- `response.empty(metadata)`: Creates an empty response
- `response.handoff(agent, args?)`: Redirects to another agent within the same project

### AgentContext

The `AgentContext` interface provides access to various capabilities:

- `context.logger`: Logging functionality
- `context.kv`: Key-Value storage
- `context.vector`: Vector storage
- `context.getAgent(params)`: Gets a handle to a remote agent
- `context.tracer`: OpenTelemetry tracing

## 3. Storage APIs

### Key-Value Storage

Access through `context.kv`:

- `context.kv.get(name, key)`: Retrieves a value
- `context.kv.set(name, key, value, params)`: Stores a value with optional params (KeyValueStorageSetParams)
- `context.kv.delete(name, key)`: Deletes a value

### Vector Storage

Access through `context.vector`:

- `context.vector.upsert(name, ...documents)`: Inserts or updates vectors
- `context.vector.search(name, params)`: Searches for vectors
- `context.vector.delete(name, ...ids)`: Deletes vectors

## 4. Logging

Access through `context.logger`:

- `context.logger.debug(message, ...args)`: Logs a debug message
- `context.logger.info(message, ...args)`: Logs an informational message
- `context.logger.warn(message, ...args)`: Logs a warning message
- `context.logger.error(message, ...args)`: Logs an error message
- `context.logger.child(opts)`: Creates a child logger with additional context

## 5. Best Practices

- Use TypeScript for better type safety and IDE support
- Import types from `@agentuity/sdk`
- Use structured error handling with try/catch blocks
- Leverage the provided logger for consistent logging
- Use the storage APIs for persisting data
- Consider agent communication for complex workflows

For complete documentation, visit: https://agentuity.dev/SDKs/javascript/api-reference
