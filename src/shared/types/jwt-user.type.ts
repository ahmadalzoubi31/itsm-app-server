export type JwtUser = {
  userId: string;
  username: string;
  role: string; // primary role key (e.g., 'admin', 'agent', 'requester')
  groupIds?: string[]; // groups user belongs to
};
