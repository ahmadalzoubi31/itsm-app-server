// src/shared/infra/cls/cls-store.interface.ts
import { ClsStore as BaseClsStore } from 'nestjs-cls';

export interface ClsStore extends BaseClsStore {
  user?: {
    userId: string;
    username: string;
    role?: string;
    groupIds?: string[];
    jti: string;
  };
}
