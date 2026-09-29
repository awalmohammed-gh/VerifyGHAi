import { z } from 'zod';

export const aiGenerateSchema = z.object({
  prompt: z
    .string({
      message: 'Prompt must be a string',
    })
    .trim()
    .min(1, 'Prompt cannot be empty')
    .max(50000, 'Prompt exceeds the maximum allowed length (50,000 characters)'),

  stream: z
    .boolean({
      message: 'Stream parameter must be a boolean',
    })
    .optional()
    .default(false),

  model: z
    .string({
      message: 'Model must be a string',
    })
    .optional(),

  systemInstruction: z
    .string({
      message: 'systemInstruction must be a string',
    })
    .optional(),

  temperature: z
    .number({
      message: 'temperature must be a number between 0 and 2',
    })
    .min(0)
    .max(2)
    .optional(),

  topP: z
    .number({
      message: 'topP must be a number between 0 and 1',
    })
    .min(0)
    .max(1)
    .optional(),

  topK: z
    .number({
      message: 'topK must be an integer',
    })
    .int()
    .min(1)
    .optional(),

  fileData: z
    .object({
      mimeType: z
        .string({
          message: 'mimeType is required for fileData',
        })
        .min(1, 'mimeType cannot be empty'),
      base64: z
        .string({
          message: 'base64 data string is required for fileData',
        })
        .min(1, 'base64 data cannot be empty'),
    })
    .optional(),

  searchGrounding: z
    .boolean({
      message: 'searchGrounding must be a boolean',
    })
    .optional(),
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;
