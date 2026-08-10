import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(), // 카드에 쓸 한 줄
    proves: z.string(), // 이 리포트가 증명하는 공고 요건
    date: z.coerce.date(),
    order: z.number(), // 랜딩 카드 정렬
    draft: z.boolean().default(false),
  }),
});

export const collections = { reports };
