import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { handleHelpMessage } from '../../lib/utils';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  const help = await handleHelpMessage(req, resp, ctx, 'vector storage');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  const collection = 'kitchen-sink'; // Collections are auto-created if they don't exist
  const key = `storage-vector-${Date.now()}`;

  // Store and search plain-text content
  if (req.data.contentType === 'text/plain') {
    try {
      const content = await req.data.text();

      // Index the text in vector storage (it gets converted to embeddings)
      await ctx.vector.upsert(collection, {
        key,
        document: content, // This text gets embedded for semantic search
        metadata: {
          content: content, // Store original content for retrieval
          timestamp: new Date().toISOString(), // Optional, add whatever metadata you want
        },
      });

      // Search with partial text to demonstrate semantic similarity
      // NOTE: This demo uses partial text for predictable results.
      // True semantic search would find related content with different words,
      // e.g., searching "comfortable seating" to find "ergonomic office chair"
      const searchQuery = content.split(' ').slice(0, 3).join(' ');

      const results = await ctx.vector.search(collection, {
        query: searchQuery, // This query gets compared against stored embeddings
        limit: 5,
        similarity: 0.5, // Minimum similarity threshold
      });

      // Clean up the test entry (collection persists)
      await ctx.vector.delete(collection, key);

      // Return formatted text response
      if (results.length > 0 && results[0]) {
        return resp.text(
          `Searched For: "${searchQuery}"\n\n` +
            `Found: "${results[0].metadata?.content}"\n\n` +
            `Similarity: ${results[0].similarity.toFixed(3)}`
        );
      } else {
        return resp.text(
          `No similar content found for query: "${searchQuery}"`
        );
      }
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // Store and search JSON content
  if (req.data.contentType === 'application/json') {
    try {
      const content = await req.data.json();

      // Always stringify JSON for the document field (what gets embedded)
      const textToEmbed = JSON.stringify(content);

      // Store original content in metadata for retrieval
      await ctx.vector.upsert(collection, {
        key,
        document: textToEmbed, // This text gets embedded for semantic search
        metadata: {
          content: textToEmbed, // Store the stringified version
          timestamp: new Date().toISOString(), // Optional, add whatever metadata you want
        },
      });

      // Search with partial text to demonstrate similarity matching
      // NOTE: This demo uses partial text for predictable results.
      // True semantic search would find related content with different words,
      // e.g., searching "comfortable seating" to find "ergonomic office chair"
      const searchQuery = textToEmbed.split(' ').slice(0, 3).join(' ');

      const results = await ctx.vector.search(collection, {
        query: searchQuery, // Partial query to show semantic search
        limit: 5,
        similarity: 0.5, // Minimum similarity threshold
      });

      // Clean up the test entry (collection persists)
      await ctx.vector.delete(collection, key);

      // Return formatted text response
      if (results.length > 0 && results[0]) {
        return resp.text(
          `Searched For: \`${searchQuery}\`\n\n` +
            `Found: \`${results[0].metadata?.content}\`\n\n` +
            `Similarity: ${results[0].similarity.toFixed(3)}`
        );
      } else {
        return resp.text(
          `No similar content found for query: \`${searchQuery}\``
        );
      }
    } catch (error) {
      ctx.logger.error('Error running agent:', error);

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return resp.text('You sent an invalid message.');
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Vector Store</span> example agent.\n\n### About\n\nVector storage enables semantic search — finding content by meaning rather than exact matches. Perfect for AI-powered search, recommendations, and knowledge bases.\n\n### Testing\n\nSend a plain-text or JSON message and we'll store it, search for similar content (by querying for the beginning of the content you send), and show similarity scores.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `The quick brown fox jumps over the lazy dog`,
        contentType: 'text/plain',
      },
      {
        data: `{"message": "TypeScript is great for building applications"}`,
        contentType: 'application/json',
      },
    ],
  };
};
