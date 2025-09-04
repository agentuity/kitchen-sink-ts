import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(
    req,
    resp,
    ctx,
    'agent handler response'
  );

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const content = await req.data.text();

  // Images
  if (content === 'Image') {
    return resp.png(await Bun.file('./src/lib/test-image.png').arrayBuffer());
  }

  // Plain-text
  if (content === 'Plain-text') {
    return resp.text('Hello, world!');
  }

  // Streaming content
  if (content === 'Stream') {
    const result = await streamText({
      model: openai('gpt-5-mini'),
      prompt:
        'Give me a list of 25 popular international cities, in markdown format.',
    });

    return resp.stream(result.textStream, 'text/markdown');
  }

  // NOTE: We'd enable this, but then the tests would fail
  // if (content === 'Show me a 500 error') {
  //   return resp.text(`Successfully failed to return a 500 error`, {
  //     status: 500,
  //     statusText: 'Internal Server Error',
  //   });
  //   return new Response('Internal Server Error', { status: 500 });
  // }

  // return resp.binary();
  // return resp.data();
  // return resp.gif();
  // return resp.handoff();   // Check out the `io-agent` example
  // return resp.html();
  // return resp.jpeg();
  // return resp.json();
  // return resp.m4a();
  // return resp.m4p();
  // return resp.markdown();
  // return resp.mp3();
  // return resp.mp4();
  // return resp.ogg();
  // return resp.pdf();
  // return resp.wav();
  // return resp.webm();
  // return resp.webp();
  // ... and more all the time

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Agent Handler Response</span> example agent.\n\n### About\n\nData that is sent to your agent is transferred as raw binary data and the content type is provided to the agent through the request object.\n\nWe provide a few different ways to handle data formats in your agents to make it easier to work with different data types. Of course, your agent can always perform its own data handling by use the raw data and the content type property. However, most common data types are supported out of the box.\n\n### Testing\n\nChoose one of the pre-set message options and we'll show you the appropriate response.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `Image`,
        contentType: 'text/plain',
      },
      {
        data: `Plain-text`,
        contentType: 'text/plain',
      },
      {
        data: `Stream`,
        contentType: 'text/plain',
      },
      // {
      //   data: `500 Error`,
      //   contentType: 'text/plain',
      // },
    ],
  };
};
