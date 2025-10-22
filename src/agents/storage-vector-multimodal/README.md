# Vector Storage - Images (Multimodal)

This agent demonstrates how to use Agentuity's vector storage with **true multimodal image embeddings** using Voyage AI's voyage-multimodal-3 model.

## Overview

The agent showcases:
- **Multimodal Embedding Generation**: Uses Voyage AI's `voyage-multimodal-3` model with actual image files
- **True Image Understanding**: Generates embeddings from real image data (not just descriptions)
- **Semantic Search**: Find images using natural language descriptions
- **Vector Storage**: Store and retrieve multimodal embeddings using `ctx.vector`
- **AI Analysis**: Generate contextual explanations of search results

## How It Works

1. **Load Image Files**: Reads actual image files from the `images/` directory
2. **Generate Multimodal Embeddings**: Creates embeddings combining image data + text descriptions
3. **Store in Vector DB**: Uses `ctx.vector.upsert()` with Voyage multimodal embeddings
4. **Search**: Finds similar images using `ctx.vector.search()` with query embeddings
5. **Analyze**: Uses GPT-4o-mini to explain why images matched the query

## Key Features

### Multimodal Embeddings
This agent uses **actual image files** combined with text descriptions to create rich embeddings:

```typescript
// Load actual image
const imageBuffer = readFileSync(imagePath);
const imageBase64 = imageBuffer.toString('base64');

// Generate multimodal embedding
const embeddingResponse = await voyageClient.multimodalEmbed({
  inputs: [{
    content: [
      { type: 'image_base64', imageBase64: `data:image/jpeg;base64,${imageBase64}` },
      { type: 'text', text: image.description }
    ]
  }],
  model: 'voyage-multimodal-3',
});

const embedding = embeddingResponse.data?.[0]?.embedding;
if (!embedding) throw new Error('Failed to generate embedding');

await ctx.vector.upsert(bucket, {
  key: image.id,
  embeddings: embedding,
  metadata: { ...image }
});
```

### Text-to-Image Search
Search for images using natural language queries:
- "mountains at sunset" → finds mountain-sunset image
- "city lights at night" → finds city-night image
- "tropical waterfall" → finds waterfall image

### Voyage AI Integration
Uses the `voyageai` TypeScript SDK for multimodal embeddings:

```typescript
import { VoyageAIClient } from 'voyageai';

const voyageClient = new VoyageAIClient();

// Generate embedding from text query
const queryEmbedding = await voyageClient.multimodalEmbed({
  inputs: [{
    content: [
      { type: 'text', text: prompt }
    ]
  }],
  model: 'voyage-multimodal-3',
});
```

## Sample Images

The agent includes 6 sample image descriptions:
- Mountain sunset with alpine lake
- Urban cityscape at night
- Beach at sunrise
- Forest path with sunlight
- Desert dunes
- Tropical waterfall

## Usage

Send natural language queries to search for images:
- "mountains at sunset"
- "city lights at night"
- "tropical waterfall"
- "sandy beach with ocean"

The agent returns:
1. Top 3 matching images with similarity scores
2. AI-generated analysis explaining the matches
3. Best match recommendation

## Dependencies

- `voyageai` - Voyage AI TypeScript SDK for multimodal embeddings
- `@ai-sdk/openai` - GPT-4o-mini for result analysis
- `@agentuity/sdk` - Vector storage operations

## Setup

### 1. Add Your Voyage AI API Key

Set your Voyage AI API key as an environment variable:

```bash
export VOYAGE_API_KEY=your-api-key-here
```

Or add it to your `.env` file:

```
VOYAGE_API_KEY=your-api-key-here
```

Get your API key from: https://www.voyageai.com/

### 2. Add Image Files

Place your image files in the `images/` directory with the filenames specified in `sample-images.json`:

```
src/agents/storage-vector-images/images/
├── mountain-sunset.jpg
├── city-night.jpg
├── beach-sunrise.jpg
├── forest-path.jpg
├── desert-dunes.jpg
└── waterfall.jpg
```

You can use any images you like - just make sure the filenames match the JSON configuration.

## Notes

- This agent uses **actual image files** from the `images/` directory
- Voyage AI's `voyage-multimodal-3` model supports both image and text inputs
- Embeddings combine visual features from images with semantic meaning from text descriptions
- All vector data is cleaned up after each query for demo purposes
- Similarity threshold is set to 0.5 (50% similarity minimum)
- Images are read using Node.js `fs` module and converted to base64 for the API
