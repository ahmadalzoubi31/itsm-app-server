import { ConfigService } from "@nestjs/config";

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export interface CookieOptionsConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  domain?: string;
  maxAge?: number;
}

export function getCookieOptions(
  config: ConfigService,
  type: "access" | "refresh" | "clear" = "access"
): CookieOptionsConfig {
  const isProduction = config.get<string>("NODE_ENV") === "production";
  const domain = config.get<string>("COOKIE_DOMAIN");

  const baseOptions: CookieOptionsConfig = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    ...(domain && { domain }),
  };

  if (type === "access") {
    const accessTokenMaxAge = config.get<number>("JWT_EXPIRES_IN");
    return {
      ...baseOptions,
      maxAge: accessTokenMaxAge || 15 * 60 * 1000,
    };
  }

  if (type === "refresh") {
    const refreshTokenMaxAge = config.get<number>("REFRESH_JWT_EXPIRES_IN");
    return {
      ...baseOptions,
      maxAge: refreshTokenMaxAge || 7 * 24 * 60 * 60 * 1000,
    };
  }

  return baseOptions;
}
