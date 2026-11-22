import { z } from 'zod';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schemas';
import { Role, UserStatus } from '@prisma/client';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}
