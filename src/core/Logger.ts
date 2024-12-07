import { createLogger, format, Logger as WinstonLogger } from 'winston';
import fs from 'fs';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { environment, logDirectory } from '@config';
import { Console } from 'winston/lib/winston/transports';

let dir = logDirectory;
if (!dir) dir = path.resolve('logs');

// create directory if it is not present
if (!fs.existsSync(dir)) {
  // Create the directory if it does not exist
  fs.mkdirSync(dir);
}

const minimumLogLevel = environment === 'development' ? 'debug' : 'warn';

const consoleTransport = new Console({
  level: minimumLogLevel,
  handleExceptions: true,
  handleRejections: true,
  format: format.combine(format.errors({ stack: true }), format.prettyPrint()),
});

const dailyTransport = new DailyRotateFile({
  level: minimumLogLevel,
  filename: logDirectory + '/%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  handleExceptions: true,
  handleRejections: true,
  json: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const Logger: WinstonLogger = createLogger({
  transports: [consoleTransport, dailyTransport],
  exceptionHandlers: [dailyTransport],
  exitOnError: false,
});

export default Logger;
