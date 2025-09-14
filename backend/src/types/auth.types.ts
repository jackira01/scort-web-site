import { Request } from 'express';

export interface User {
  id: string;
  _id: string;
  role?: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: User;
}