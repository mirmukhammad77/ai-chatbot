import { type UserRoleType } from '../../users/entities/user.entity.js';

export type LoginResponse = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRoleType;
  accessToken: string;
  refreshToken: string;
};
