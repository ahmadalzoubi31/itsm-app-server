export default () => ({
  secret: process.env.JWT_SECRET,
  accessTokenExpire: process.env.JWT_EXPIRATION_TIME || '5m',
  refreshTokenExpire: process.env.REFRESH_JWT_EXPIRES_IN || '7d',
});
