import type { CookieOptions, Response } from 'express';

export const ACCESS_COOKIE = 'rc_access';
export const REFRESH_COOKIE = 'rc_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export interface CookieSettings {
  secure: boolean;
  domain?: string;
}

function base(settings: CookieSettings, path: string): CookieOptions {
  return {
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'lax',
    path,
    ...(settings.domain && settings.domain !== 'localhost' ? { domain: settings.domain } : {}),
  };
}

export function setAuthCookies(
  res: Response,
  settings: CookieSettings,
  tokens: { accessToken: string; accessExpiresIn: number; refreshToken: string; refreshExpiresAt: Date },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base(settings, '/'), maxAge: tokens.accessExpiresIn * 1000 });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...base(settings, REFRESH_COOKIE_PATH), expires: tokens.refreshExpiresAt });
}

export function clearAuthCookies(res: Response, settings: CookieSettings) {
  res.clearCookie(ACCESS_COOKIE, base(settings, '/'));
  res.clearCookie(REFRESH_COOKIE, base(settings, REFRESH_COOKIE_PATH));
}
