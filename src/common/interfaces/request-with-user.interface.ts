import { Request } from 'express';
import { UserRole } from './user-role.type';

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    role: UserRole;
  };
}
