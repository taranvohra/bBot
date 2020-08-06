import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, label, prettyPrint } = format;
export default createLogger({
  level: 'debug',
  format: combine(label({ label: 'bBot' }), timestamp(), prettyPrint()),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: 'bBot-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '25m',
      maxFiles: '14d',
      dirname: 'logs',
    }),
  ],
});
