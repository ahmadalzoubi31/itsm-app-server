// src/shared/infra/email/pop3.client.ts
export type Pop3Options = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
};
export type Pop3Message = {
  id: string;
  from?: string;
  to?: string[];
  subject?: string;
  date?: Date;
  text?: string;
  html?: string;
};
export class Pop3Client {
  constructor(private readonly _opts: Pop3Options) {}
  async connect(): Promise<void> {} // TODO
  async list(): Promise<string[]> {
    return [];
  }
  async retrieve(_id: string): Promise<Pop3Message> {
    return { id: '0' };
  }
  async quit(): Promise<void> {}
}
