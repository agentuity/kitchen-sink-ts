import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { z } from 'zod';
import { handleHelpMessage } from '../../lib/utils';

// Zod schemas for type-safe API responses
const TodoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

const HTTPBinResponseSchema = z.object({
  json: z.record(z.string(), z.unknown()), // The data we sent, echoed back
});

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'API IO');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const command = await req.data.text();

  // GET request example with JSON parsing
  if (command === 'Fetch Todo') {
    try {
      ctx.logger.info('Fetching todo from JSONPlaceholder API');
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos/1'
      );

      if (!response.ok) {
        ctx.logger.error('JSONPlaceholder API error:', response.status);
        return resp.text('JSONPlaceholder API unavailable, try again later');
      }

      const rawData = await response.json();
      const todo = TodoSchema.parse(rawData);

      ctx.logger.info('Todo fetched successfully');
      return resp.markdown(`## Todo from JSONPlaceholder

**${todo.title}**

Status: ${todo.completed ? 'Completed' : 'Pending'}

*User ID: ${todo.userId} | Todo ID: ${todo.id}*

---
*Fetched from JSONPlaceholder - a free REST API for testing*`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.logger.warn('Invalid todo data format:', error);
        return resp.text('Received unexpected data format from API');
      }
      ctx.logger.error('Error fetching todo:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // POST request example with JSON payload
  if (command === 'Echo POST Data') {
    try {
      const testData = {
        message: 'Hello from Agentuity agent!',
        timestamp: new Date().toISOString(),
        agent: 'io-api',
        testData: {
          purpose: 'Demonstrating POST request',
          method: 'POST',
        },
      };

      ctx.logger.info('Sending POST request to HTTPBin echo service');
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        ctx.logger.error('HTTPBin API error:', response.status);
        return resp.text('HTTPBin API unavailable, try again later');
      }

      const rawEchoData = await response.json();
      HTTPBinResponseSchema.parse(rawEchoData); // Validate response format

      ctx.logger.info('POST request completed successfully');
      return resp.markdown(`## POST Request Successful

**Data Sent:**
\`\`\`json
{
  "message": "${testData.message}",
  "agent": "${testData.agent}",
  "purpose": "${testData.testData.purpose}"
}
\`\`\`

The HTTPBin echo service successfully received and returned the data.`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.logger.warn('Invalid HTTPBin response format:', error);
        return resp.text(
          'Received unexpected response format from echo service'
        );
      }
      ctx.logger.error('Error with POST request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // HEAD request example for health checks
  if (command === 'Check Website Status') {
    try {
      ctx.logger.info('Checking website status with HEAD request');
      const startTime = Date.now();
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts/1',
        {
          method: 'HEAD',
        }
      );
      const duration = Date.now() - startTime;

      const contentType = response.headers.get('content-type') || 'unknown';

      ctx.logger.info(`Website status check completed in ${duration}ms`);
      return resp.markdown(`## Website Status Check

**URL:** https://jsonplaceholder.typicode.com/posts/1

**Status:** ${response.status} ${response.statusText}

**Response Time:** ${duration}ms

**Content-Type:** ${contentType}

**Server Available:** ${response.ok ? 'Yes' : 'No'}

*HEAD request completed successfully*`);
    } catch (error) {
      ctx.logger.error('Error checking website status:', error);
      return resp.text('Request failed - website may be unavailable');
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">API IO</span> example agent.\n\n### About\n\nHTTP requests allow agents to fetch data from external APIs, send data to services, and check system status. This agent demonstrates GET, POST, and HEAD request methods.\n\n### Testing\n\nChoose a command to see different HTTP methods in action with real external APIs.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: 'Fetch Todo',
        contentType: 'text/plain',
      },
      {
        data: 'Echo POST Data',
        contentType: 'text/plain',
      },
      {
        data: 'Check Website Status',
        contentType: 'text/plain',
      },
    ],
  };
};
