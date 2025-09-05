import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';
import sampleProducts from './sample-products.json';

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

  // Get data in the appropriate format
  let data: unknown;
  switch (req.data.contentType) {
    case 'application/json':
      // Stringify JSON inputs for vector search
      data = JSON.stringify(await req.data.json());
      break;
    case 'text/plain':
      data = await req.data.text();
      break;
    default:
      data = await req.data.text();
      break;
  }

  // The vector storage search() method expects a string query
  const query = data as string;

  try {
    // Define collection name
    const PRODUCTS_DB = 'kitchen-sink-products';

    // Upsert sample products data
    for (const product of sampleProducts) {
      await ctx.vector.upsert(PRODUCTS_DB, {
        key: product.id,
        // Document: Product description converted to embeddings for feature-based semantic search
        // All other data is kept in metadata only for cleaner similarity matching
        document: `${product.description}`,
        // Metadata: We store the complete product object here (to access/print data like price, rating, and feedback)
        metadata: product,
      });
    }

    // Search for products: returns array with similarity scores (0-1)
    const productResults = await ctx.vector.search(PRODUCTS_DB, {
      query,
      limit: 3, // Get top 3 matches
      similarity: 0.3, // Minimum similarity threshold
    });

    // Return top 3 products if we found any matches
    if (productResults.length > 0) {
      // Format the top results with similarity scores
      let response = '## Top Matching Chairs\n\n';

      productResults.forEach((result, index) => {
        const product = result.metadata;

        response += `### ${index + 1}. ${product?.name}\n`;
        response += `**Price:** $${product?.price} | **Rating:** ${product?.avg_rating}/5 stars | **Similarity:** ${result.similarity.toFixed(2)}\n\n`;
        response += `${product?.description}\n\n`;
      });

      // Build context for LLM recommendation (using top 3 products, based on similarity score)
      const context = productResults
        .map((result) => {
          const product = result.metadata;
          return `${product?.name}: $${product?.price}, ${product?.avg_rating}★, ${product?.customer_feedback}`;
        })
        .join('\n');

      // Generate brief recommendation using LLM
      const { text: recommendation } = await generateText({
        model: openai('gpt-5-nano'),
        system: `You are a furniture consultant who provides clear, concise recommendations. Use plain text only, no special formatting.`,
        prompt: `Customer searched for: "${query}"

Options:
${context}

Provide a brief, focused recommendation in one sentence. Plain text only. Example: "Choose the Budget Basic for price, or consider the Mesh Breeze at $449 for better comfort."`,
      });

      response += '## Recommendation\n\n';
      response += recommendation;

      // Use vector.get() to fetch full details of the top result, using its key
      if (productResults[0]) {
        const topProductDetail = await ctx.vector.get(
          PRODUCTS_DB,
          productResults[0].key
        );
        if (topProductDetail?.metadata?.customer_feedback) {
          response += '\n\n';
          response += `**Customer feedback for #1 match (${topProductDetail.metadata.name}):** ${topProductDetail.metadata.customer_feedback}`;
        }
      }

      // Clean up: delete all entries we created once we're done
      for (const product of sampleProducts) {
        await ctx.vector.delete(PRODUCTS_DB, product.id);
      }

      return resp.text(response);
    } else {
      return resp.text(
        'No chairs found matching your search. Try:\n' +
          '• "comfortable office chair"\n' +
          '• "ergonomic chair"\n' +
          '• "budget chair"'
      );
    }
  } catch (error) {
    ctx.logger.error('Error running agent:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Vector Storage</span> example agent.\n\n### About\n\nVector storage enables semantic search — finding content by meaning rather than exact matches. This example demonstrates chair shopping with product reviews to showcase how vector search understands context and intent.\n\n### How It Works\n\nSemantic search understands meaning, not just keywords. When you search for "comfortable chair", it finds chairs that match that concept, even if they use different words like "ergonomic" or "supportive".\n\n### Try These Examples\n\n• Search naturally: "comfortable office chair" or "chair for gaming"\n\n• Budget-focused: "affordable chair" or "budget seating"\n\n• Quality-focused: "best chair" or "premium executive chair"\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,
    prompts: [
      {
        data: `comfortable office chair`,
        contentType: 'text/plain',
      },
      {
        data: `budget chair for home office`,
        contentType: 'text/plain',
      },
      {
        data: `best ergonomic chair`,
        contentType: 'text/plain',
      },
    ],
  };
};
