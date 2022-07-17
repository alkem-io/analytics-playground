import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);

export const createLogger = () => {
  return winston.createLogger({
    transports: [
      new winston.transports.Console({ level: 'info', format: logFormat }),
      new winston.transports.File({
        filename: 'btc-graph-info.log',
        level: 'info',
      }),
      new winston.transports.File({
        filename: 'btc-graph-warnings.log',
        level: 'warn',
      }),
    ],
  });
};

export const createProfiler = () => {
  return winston.createLogger({
    transports: [
      new winston.transports.Console({ level: 'info', format: logFormat }),
      new winston.transports.File({
        filename: 'profile-info.log',
        level: 'silly',
      }),
    ],
  });
};
