import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = format;
const errorStackFormat = format((info) => {
  if (info instanceof Error) {
    return Object.assign({}, info, {
      stack: info.stack,
      message: info.message,
      errorStack: JSON.stringify(info.stack, null, 2),
    });
  }
  return info;
});
const myFormat = printf((info) => {
  if (info.stack) {
    return `${info.timestamp} [${info.level}] ${info.message} : ${info.stack}`;
  }
  return `${info.timestamp} [${info.level}]: ${info.message}`;
});

export default createLogger({
  level: 'debug',
  format: combine(
    colorize({ all: true }),
    timestamp(),
    errorStackFormat(),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: 'bbot-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '25m',
      maxFiles: '14d',
      dirname: 'logs',
    }),
  ],
});
