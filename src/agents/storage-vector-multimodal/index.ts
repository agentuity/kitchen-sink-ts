import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { VoyageAIClient } from 'voyageai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { handleHelpMessage } from '../../lib/utils';
import sampleImages from './sample-images.json';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * MULTIMODAL IMAGE EMBEDDINGS DEMO
 *
 * This agent demonstrates how to use Agentuity's vector storage with true multimodal embeddings.
 * We use Voyage AI's voyage-multimodal-3 model to generate embeddings that understand both
 * image content and text descriptions, enabling powerful semantic image search.
 *
 * Key concepts demonstrated:
 * 1. Loading actual image files from the filesystem
 * 2. Generating multimodal embeddings (combining image pixels + text)
 * 3. Storing custom embeddings in Agentuity's vector database
 * 4. Searching for semantically similar images using natural language
 * 5. Using AI to explain search results to users
 */

// Initialize the Voyage AI client for generating multimodal embeddings
// This client will be used to create vector representations of our images
// Note: Requires VOYAGE_API_KEY environment variable to be set
const voyageClient = new VoyageAIClient({apiKey: process.env.VOYAGE_API_KEY});

/**
 * Main agent handler function
 *
 * Every Agentuity agent exports a default function that receives three parameters:
 * @param req - AgentRequest: Contains the incoming request data and metadata
 * @param resp - AgentResponse: Used to send responses back to the user
 * @param ctx - AgentContext: Provides access to Agentuity services (logging, storage, etc.)
 */
export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  /***************
   * Boilerplate *
   ***************/

  // Handle help requests - if user types "help", show documentation
  const help = await handleHelpMessage(req, resp, ctx, 'vector storage with images');

  if (help) {
    return help;
  }

  /************
   * Examples *
   ************/

  // Define the vector storage bucket name
  // Buckets are auto-created if they don't exist - think of them as isolated collections
  const bucket = 'kitchen-sink-images';

  try {
    // Extract the user's search query from the request
    // req.data provides access to the request payload in different formats
    const prompt = await req.data.text();

    // ctx.logger provides structured logging with different severity levels
    // Logs are searchable in the Agentuity dashboard
    ctx.logger.info(`Processing image search query: "${prompt}"`);

    // Get the directory where images are stored
    // When running in production/build mode, we need to navigate from the build directory
    // back to the source directory where the images are located
    // import.meta.dir in build mode: /path/to/.agentuity/src/agents/storage-vector-multimodal
    // We need: /path/to/src/agents/storage-vector-multimodal/images
    const currentDir = import.meta.dir;
    const isInBuildDir = currentDir.includes('.agentuity');
    const imagesDir = isInBuildDir
      ? join(currentDir, '../../../../src/agents/storage-vector-multimodal/images')
      : join(currentDir, 'images');

    ctx.logger.info(`Loading images from directory: ${imagesDir}`);

    /*******************************************
     * STEP 1: GENERATE AND STORE EMBEDDINGS  *
     *******************************************/

    // Process each image: load file, generate embedding, store in vector database
    ctx.logger.info(`Processing ${sampleImages.length} sample images for vector store bucket: ${bucket}`);

    for (const image of sampleImages) {
      ctx.logger.debug(`Processing image: ${image.id} - ${image.filename}`);

      try {
        // Load the actual image file from disk
        const imagePath = join(imagesDir, image.filename);
        const imageBuffer = readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        ctx.logger.debug(`Loaded image ${image.filename}, size: ${imageBuffer.length} bytes`);

        // Generate a multimodal embedding using Voyage AI
        // This combines BOTH the visual content of the image AND the text description
        // into a single vector that captures semantic meaning from both modalities
        ctx.logger.debug(`Generating multimodal embedding for ${image.id}`);
        const embeddingResponse = await voyageClient.multimodalEmbed({
          inputs: [{
            content: [
              // First input: the image as base64 in data URL format
              { type: 'image_base64', imageBase64: `data:image/jpeg;base64,${imageBase64}` },
              // Second input: text description of the image
              { type: 'text', text: image.description }
            ]
          }],
          model: 'voyage-multimodal-3', // Voyage's multimodal model
        });

        // Extract the embedding vector from the response
        const embeddings = embeddingResponse.data?.[0]?.embedding;
        if (!embeddings) {
          throw new Error('Failed to generate embedding');
        }
        ctx.logger.debug(`Generated embedding for ${image.id}, dimension: ${embeddings.length}`);

        // Store the embedding in Agentuity's vector database
        // ctx.vector is the interface to Agentuity's vector storage service
        ctx.logger.debug(`Upsertting:
{
  key: ${image.id},
  embeddings,
  document: ${image.description},
  metadata: {
    image: {
      id: ${image.id},
      description: ${image.description},
      filename: ${image.filename},
      tags: ${image.tags}
    }
    type: 'image',
    imageBase64: ${imageBase64.substring(0, 100) + '...'},
  },
}
        `)
        await ctx.vector.upsert(bucket, {
          // Unique identifier for this vector - used for retrieval and deletion
          key: image.id,

          // The custom embedding vector we generated with Voyage AI
          // This is an array of numbers (typically 1024 dimensions for voyage-multimodal-3)
          embeddings,

          // Also store the text description as a 'document'
          // This allows Agentuity to use its own text embedding for search compatibility
          document: image.description,

          // Metadata: any additional data you want to store alongside the vector
          // This is returned when you search and can be filtered on
          metadata: {
            ...image, // All original image data (id, filename, description, tags)
            type: 'image',
            imageBase64: imageBase64.substring(0, 100) + '...', // Store truncated version for reference
          },
        });
      } catch (imageError) {
        // If an image fails to process, log a warning and continue with others
        ctx.logger.warn(`Failed to process image ${image.filename}: ${imageError}. Skipping...`);
        continue;
      }
    }
    ctx.logger.info('Successfully upserted all sample images to vector store');

    /*******************************************
     * STEP 2: SEARCH FOR SIMILAR IMAGES      *
     *******************************************/

    // Search the vector database for images similar to the user's query
    // Agentuity's ctx.vector.search() takes a text query and automatically:
    // 1. Generates an embedding for the query text
    // 2. Compares it against all stored vectors using cosine similarity
    // 3. Returns the most similar results ranked by similarity score
    ctx.logger.info(`Searching vector store with limit: 3, similarity threshold: 0.3`);
    const imageResults = await ctx.vector.search(bucket, {
      query: prompt,        // Natural language search query from the user
      limit: 3,             // Return top 3 most similar results
      similarity: 0.3,      // Minimum similarity score (0.0 to 1.0, where 1.0 is exact match)
    });
    ctx.logger.info(`Vector search returned ${imageResults.length} results`);

    // Log search results for debugging
    if (imageResults.length > 0) {
      ctx.logger.debug('Search results:', imageResults.map(r => ({
        id: r.metadata?.id,
        description: r.metadata?.description,
        similarity: r.similarity  // Similarity score between 0 and 1
      })));
    }

    /*******************************************
     * STEP 3: FORMAT AND RETURN RESULTS      *
     *******************************************/

    // If we found matching images, format them nicely for the user
    if (imageResults.length > 0) {
      // Start building a markdown-formatted response
      let response = '## Matching Images\n\n';

      // List each matching image with its similarity score
      imageResults.forEach((result) => {
        const image = result.metadata;  // metadata contains all the data we stored earlier
        response += `#### ${image?.id}\n`;
        response += `Similarity: ${result.similarity.toFixed(3)}\n\n`;
        response += `${image?.description}\n\n`;
      });

      // Build context string for the AI analysis
      const context = imageResults
        .map((result) => {
          const image = result.metadata;
          return `Image ID: ${image?.id}\nDescription: ${image?.description}\nSimilarity: ${result.similarity.toFixed(3)}`;
        })
        .join('\n\n');

      ctx.logger.info('Generating AI analysis of matched images');

      // Use an LLM to generate a helpful explanation of why these images matched
      // This uses OpenAI via Agentuity's AI Gateway (automatic API key management)
      const result = await generateText({
        model: openai('gpt-4o-mini'),  // Using GPT-4o-mini through Agentuity's gateway
        system: `
          You are an image search assistant that helps users understand why certain images matched their query.
          Provide a brief, helpful explanation in 2-3 sentences using markdown format.
          Focus on explaining which image best matches their query and why.
        `,
        prompt: `
          User searched for: "${prompt}"

          Matching images:
          ${context}
        `,
      });

      // Add the AI-generated analysis to the response
      response += '---\n\n';
      response += '## Analysis\n\n';
      response += result.text;

      // Highlight the best match
      const topImage = imageResults[0];
      if (topImage?.metadata?.id) {
        response += '\n\n';
        response += `**Best match:** ${topImage.metadata.id} (${(topImage.similarity * 100).toFixed(1)}% similarity)\n`;
      }

      /*******************************************
       * STEP 4: STREAM THE MATCHING IMAGE      *
       *******************************************/

      // Load and return the best matching image file
      if (topImage?.metadata?.filename && typeof topImage.metadata.filename === 'string') {
        const bestImagePath = join(imagesDir, topImage.metadata.filename);

        try {
          // Read the actual image file from disk
          const imageBuffer = readFileSync(bestImagePath);
          ctx.logger.info(`Streaming image: ${topImage.metadata.filename} (${imageBuffer.length} bytes)`);

          // First send the markdown analysis, then the image
          // Note: We can't send multiple responses, so we'll include the image in markdown
          response += '\n\n---\n\n';
          response += '### Matched Image\n\n';

          // Convert image to base64 for embedding in markdown
          const imageBase64 = imageBuffer.toString('base64');
          const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

          // Embed the image in markdown using an img tag
          response += `![${topImage.metadata.description}](${imageDataUrl})\n\n`;
          response += `*${topImage.metadata.description}*\n`;

        } catch (imageError) {
          ctx.logger.warn(`Failed to load image for display: ${imageError}`);
        }
      }

      /*******************************************
       * STEP 5: CLEANUP (DEMO PURPOSES ONLY)   *
       *******************************************/

      // Delete all the vectors we created (this is just for demo purposes)
      // In a real application, you'd keep the vectors in storage for future searches
      ctx.logger.info(`Cleaning up: deleting ${sampleImages.length} images from vector store`);
      for (const image of sampleImages) {
        ctx.logger.debug(`Deleting image: ${image.id}`);
        await ctx.vector.delete(bucket, image.id);  // Delete by key
      }
      ctx.logger.info('Successfully cleaned up all sample images from vector store');

      // Return the formatted markdown response with embedded image to the user
      // resp.markdown() sets the content type and formats the response
      return resp.markdown(response);
    } else {
      // No matches found - provide helpful suggestions
      ctx.logger.warn(`No images found matching search query: "${prompt}" with similarity threshold 0.3`);
      return resp.markdown(
        'No images found matching your search. Try:\n' +
          '• "mountains at sunset"\n' +
          '• "city lights at night"\n' +
          '• "tropical waterfall"'
      );
    }
  } catch (error) {
    // Catch any unexpected errors and return a proper error response
    ctx.logger.error('Error running agent:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Welcome function - defines the agent's greeting and example prompts
 *
 * This optional export customizes what users see when they first open the agent
 * in Agentuity's DevMode interface. It provides:
 * - A welcome message explaining what the agent does
 * - Pre-configured example prompts users can click to test
 */
export const welcome = () => {
  return {
    // Welcome message shown in DevMode - supports HTML and markdown
    welcome: `Welcome to the <span style="color: light-dark(#0AA, #0FF);">Vector Storage - Images</span> example agent.

### About

This agent demonstrates how to use vector storage with **true multimodal image embeddings** using Voyage AI's multimodal-3 model. It showcases semantic image search where you can find images by describing what you're looking for in natural language.

### How It Works

- Uses **Voyage AI's voyage-multimodal-3** model to generate embeddings from actual image files
- Combines image data + text descriptions for richer semantic understanding
- Stores multimodal embeddings in Agentuity's vector database
- Searches for images using natural language queries
- Returns the most semantically similar images

### Testing

Choose one of the pre-set message options to search our sample image collection. The agent will find images that match your description based on true multimodal semantic similarity.

### Questions?

You can type "help" at any time to learn more about the capabilities of this feature, or chat with our expert agent by selecting the <span style="color: light-dark(#0AA, #0FF);">kitchen-sink</span> agent.`,

    // Pre-configured example prompts that appear as clickable buttons in DevMode
    // These make it easy for users to test the agent without typing
    prompts: [
      {
        data: 'mountains at sunset',
        contentType: 'text/plain',
      },
      {
        data: 'city lights at night',
        contentType: 'text/plain',
      },
      {
        data: 'tropical waterfall',
        contentType: 'text/plain',
      },
      {
        data: 'sandy beach with ocean',
        contentType: 'text/plain',
      },
    ],
  };
};
