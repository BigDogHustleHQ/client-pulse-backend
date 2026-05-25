import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// Dev: colorized prefix format matching the existing [module] convention.
// Prod: structured JSON — Railway log aggregators consume this directly.
const format = isDev
  ? winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, module: mod }) => {
        const prefix = mod ? `[${mod}] ` : '';
        return `${level}: ${prefix}${message}`;
      }),
    )
  : winston.format.combine(winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  silent: isTest,
  format,
  transports: [new winston.transports.Console()],
});

export function createModuleLogger(module: string): winston.Logger {
  return logger.child({ module });
}
