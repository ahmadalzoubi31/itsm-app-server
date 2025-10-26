import dbConfig from './db.config';
import jwtConfig from './jwt.config';
import outboxConfig from './outbox.config';
import smtpConfig from './smtp.config';
import envConfig from './env.config';
import loggerConfig from './logger.config';

export default () => ({
  ...dbConfig(),
  ...jwtConfig(),
  ...outboxConfig(),
  ...smtpConfig(),
  ...envConfig(),
  ...loggerConfig(),
});

export {
  dbConfig,
  jwtConfig,
  outboxConfig,
  smtpConfig,
  envConfig,
  loggerConfig,
};
