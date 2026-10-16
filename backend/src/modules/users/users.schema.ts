import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  displayName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
