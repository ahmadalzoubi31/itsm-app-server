-- Create refresh_token table
CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "isRevoked" BOOLEAN DEFAULT FALSE,
    "userAgent" VARCHAR(300),
    "ipAddress" VARCHAR(45),
    "lastUsedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_refresh_token_token ON refresh_token(token);
CREATE INDEX idx_refresh_token_user_revoked ON refresh_token("userId", "isRevoked");

-- Create token_blacklist table
CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(100) NOT NULL UNIQUE,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    reason VARCHAR(50) DEFAULT 'logout',
    "revokedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist("expiresAt");

