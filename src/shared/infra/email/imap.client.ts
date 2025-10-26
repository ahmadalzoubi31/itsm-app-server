// src/shared/infra/email/imap.client.ts
export type ImapOptions = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  mailbox?: string;
};
export type ImapMessage = {
  uid: number | string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  from?: string;
  to?: string[];
  subject?: string;
  date?: Date;
  text?: string;
  html?: string;
};
export class ImapClient {
  constructor(private readonly _opts: ImapOptions) {}
  async connect(): Promise<void> {} // TODO: implement with imapflow
  async fetchSince(_lastUid?: string | number): Promise<ImapMessage[]> {
    return [];
  }
  async close(): Promise<void> {}
}
