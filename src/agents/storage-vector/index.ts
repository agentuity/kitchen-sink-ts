import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
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

  const bucket = 'kitchen-sink'; // Buckets are auto-created if they don't exist

  try {
    const prompt = await req.data.text();

    // Upsert sample products data
    for (const product of sampleProducts) {
      await ctx.vector.upsert(bucket, {
        key: product.sku,
        // Product description converted to embeddings for feature-based semantic search
        // All other data is kept in metadata only for cleaner similarity matching
        document: `${product.description}`,
        // We store the complete product object here (to access/print data like price, rating, and feedback)
        metadata: product,
      });
    }

    // Search for products: returns array with similarity scores (0-1)
    const productResults = await ctx.vector.search(bucket, {
      query: prompt,
      limit: 3, // Get top 3 matches
      similarity: 0.3, // Minimum similarity threshold
    });

    // Return top 3 products if we found any matches
    if (productResults.length > 0) {
      // Format the top results with similarity scores
      let response = '## Top Matching Chairs\n\n';

      productResults.forEach((result) => {
        const product = result.metadata;

        response += `#### ${product?.name}\n`;
        response += `\\$${product?.price} (${product?.avg_rating} rating) | Similarity: ${result.similarity.toFixed(2)}\n\n`;
      });

      // Build context for LLM recommendation (using top 3 products, based on similarity score)
      const context = productResults
        .map((result) => {
          const product = result.metadata;

          return `${product?.name}: SKU ${product?.sku}, \\$${product?.price}, ${product?.avg_rating} rating, ${product?.customer_feedback}`;
        })
        .join('\n');

      // Generate brief recommendation using LLM
      const result = await generateObject({
        model: openai('gpt-5-nano'),
        system: `
          You are a furniture consultant who provides clear, concise recommendations. Use markdown format, paragraph only (you can very sparingly use bold/emphasis, just for product names). Provide a brief, focused recommendation in 2-3 sentences. If you can work a customer review into your recommendation, do so. Do not include the SKU in your textual recommendation. Return the best matched SKU as the "recommendedSKU".

          In addition to your best recommendation, you can optionally provide an upsell suggestion. If you do, add an aditional line that tries to convince the customer to upgrade to the upsell chair and return the upsell SKU as the "upsellSKU".
        `,
        prompt: `
          Customer searched for: "${prompt}"

          Options:
          ${context}
        `,
        schema: z.object({
          summary: z.string(),
          recommendedSKU: z.string(),
          upsellSKU: z.string().optional(),
        }),
      });

      response += '---\n\n';
      response += '## Recommendation\n\n';
      response += result.object.summary.replace(/\$/g, '\\$'); // Markdown formatter sometimes thinks $ is a MaTeX block

      const customerReviewsSKU =
        result.object.upsellSKU || result.object.recommendedSKU;

      // Use vector.get() to fetch full details of the recommended product result, using its key
      if (customerReviewsSKU) {
        const topProductDetail = await ctx.vector.get(
          bucket,
          customerReviewsSKU
        );

        if (topProductDetail?.metadata?.customer_feedback) {
          response += '\n\n';
          response += `#### What customers say about ${topProductDetail.metadata.name}:\n`;
          response += topProductDetail.metadata.customer_feedback;
        }
      }

      // Delete all entries we created once we're done with the demo
      for (const product of sampleProducts) {
        await ctx.vector.delete(bucket, product.sku);
      }

      return resp.markdown(response);
    } else {
      return resp.markdown(
        'No chairs found matching your search. Try:\n' +
          '• "comfortable office chair"\n' +
          '• "budget chair for home office"\n' +
          '• "best ergonomic chair"'
      );
    }
  } catch (error) {
    ctx.logger.error('Error running agent:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => {
  return {
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Vector Storage</span> example agent.\n\n### About\n\nVector storage enables semantic search for your agents, allowing them to find information by meaning rather than keywords. Ideal for knowledge bases, RAG systems, and persistent agent memory.\n\n### Testing\n\nChoose one of the pre-set message options and we'll search a sample database of office chairs, showing you the most relevant matches and a recommendation. You'll notice that searching for "budget" chairs, for example, also return results for "affordable" and "cheap" chairs.\n\n### Questions?\n\nYou can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.\n\n### Learn More\n\nCheck out our [Vector Database Guide](https://agentuity.dev/Guides/vector-db) for more info and best practices.`,
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
