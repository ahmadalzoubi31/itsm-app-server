export default () => {
  // Determine log levels based on environment
  const getLogLevels = () => {
    const env = process.env.NODE_ENV;
    const customLevels = process.env.LOGGER_LEVELS;

    if (customLevels) {
      return customLevels.split(',').map((level) => level.trim());
    }

    // Default levels based on environment
    if (env === 'production') {
      return ['error', 'warn', 'log'];
    } else if (env === 'test') {
      return ['error', 'warn'];
    } else {
      // development
      return ['error', 'warn', 'log', 'debug', 'verbose'];
    }
  };

  return {
    logger: {
      name: process.env.LOGGER_NAME || 'ITSM-App',
      levels: getLogLevels(),
      timestamp: process.env.LOGGER_TIMESTAMP !== 'false', // true by default
      colorize: process.env.LOGGER_COLORIZE !== 'false', // true by default
      json: process.env.LOGGER_JSON === 'true', // false by default
    },
  };
};
