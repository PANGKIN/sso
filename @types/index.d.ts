import { Provider } from 'oidc-provider';
import { IUserAccountDocument } from '../models/userAccount';

declare global {
  namespace Express {
    export interface User extends IUserAccountDocument {}
    export interface Request {
      provider?: Provider;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    joinRedirectTo: string;
  }
}
