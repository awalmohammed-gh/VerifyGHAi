import { z } from 'zod';

export const createVerificationSchema = z
  .object({
    submissionType: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return 'TEXT';
        const upper = val.toUpperCase().trim();
        if (upper === 'URL' || upper === 'ARTICLE_URL' || upper === 'LINK') return 'ARTICLE_URL';
        if (upper === 'SCREENSHOT' || upper === 'IMAGE' || upper === 'DOCUMENT') return 'SCREENSHOT';
        return 'TEXT';
      }),
    content: z.string().optional(),
    sourceUrl: z.string().optional(),
    url: z.string().optional(),
    imageUrl: z.string().optional(),
    imageName: z.string().optional(),
    queryOrUrl: z.string().optional(),
  })
  .transform((data) => {
    const sourceUrl = data.sourceUrl || data.url || (data.submissionType === 'ARTICLE_URL' ? data.content : undefined);
    return {
      submissionType: (data.submissionType || 'TEXT') as 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT',
      content: data.content || data.queryOrUrl || '',
      sourceUrl: sourceUrl || '',
      imageUrl: data.imageUrl || data.imageName || '',
    };
  })
  .refine(
    (data) => {
      if (data.submissionType === 'TEXT') {
        return !!data.content && data.content.trim().length > 1;
      }
      if (data.submissionType === 'ARTICLE_URL') {
        return (!!data.sourceUrl && data.sourceUrl.trim().length > 3) || (!!data.content && data.content.trim().length > 3);
      }
      if (data.submissionType === 'SCREENSHOT') {
        return (
          (!!data.imageUrl && data.imageUrl.length > 0) ||
          (!!data.content && data.content.trim().length > 0)
        );
      }
      return true;
    },
    {
      message: 'Please provide valid content, URL, or image file for your verification type',
      path: ['content'],
    }
  );

export const verificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  classification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']).optional(),
  type: z.enum(['TEXT', 'ARTICLE_URL', 'SCREENSHOT']).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  scope: z.enum(['user', 'all', 'public']).optional(),
});
