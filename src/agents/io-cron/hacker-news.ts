import type { AgentContext } from '@agentuity/sdk';
import { z } from 'zod';

// Zod schemas for type-safe API responses
export const HNStorySchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().optional(),
});

export const DigestDataSchema = z.object({
  summary: z.string(),
  sources: z.array(z.string()),
  articleCount: z.number(),
  timestamp: z.string(),
  source: z.string(),
});

// HackerNews API endpoints
const HN_TOP_STORIES = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM = 'https://hacker-news.firebaseio.com/v0/item';

// Fetch top headlines from HackerNews
export async function fetchTopHeadlines(
  ctx: AgentContext,
  count: number = 5
): Promise<string[]> {
  try {
    const idsResponse = await fetch(
      `${HN_TOP_STORIES}?orderBy="$key"&limitToFirst=${count * 2}`
    );
    const storyIds = (await idsResponse.json()) as number[];

    const storyPromises = storyIds.slice(0, count).map(async (id) => {
      const response = await fetch(`${HN_ITEM}/${id}.json`);
      const data = await response.json();

      try {
        // Validate story data structure
        const story = HNStorySchema.parse(data);
        return story.title;
      } catch (error) {
        ctx.logger.warn(`Invalid story data for ID ${id}:`, error);
        return null;
      }
    });

    const stories = await Promise.all(storyPromises);
    return stories.filter((story): story is string => story !== null);
  } catch (error) {
    ctx.logger.error('Failed to fetch from HackerNews API:', error);
    throw error;
  }
}
