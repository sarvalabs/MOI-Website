import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Same frontmatter contract as the hand-rolled pipeline (CONTENT.md on
// feature/blog) so existing posts port without edits.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z
      .object({
        name: z.string(),
        role: z.string().optional(),
        url: z.string().url().optional(),
      })
      .optional(),
    tags: z.array(z.string()).default([]),
    takeaways: z.array(z.string()).optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
