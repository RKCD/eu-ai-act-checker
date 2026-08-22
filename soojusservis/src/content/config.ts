import { defineCollection, z } from 'astro:content';

const nouded = defineCollection({
  type: 'content',
  schema: z.object({
    order: z.number(),
    title: z.string(),
    alus: z.string(),
    intervall: z.string(),
    meieKatame: z.enum(['jah', 'osaliselt', 'ei']),
    meieKatameSilt: z.string(),
    kokkuvote: z.string(),
  }),
});

export const collections = { nouded };
