import './database';
import './workers';

import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import mongoSanitize from 'express-mongo-sanitize';
import express, { Request, Response, NextFunction } from 'express';
import { corsOptions, environment } from './config';
import { NotFoundError, ApiError, InternalError } from './core/ApiError';
import Logger from './core/Logger';
import routerV1 from './router/v1';
import cookieParser from 'cookie-parser';
import permissions from '@helpers/permissions';
import authentication from '@core/auth/authentication';
import authorization from '@core/auth/authorization';
import path from 'path';
import { appendFileSync, existsSync, writeFileSync } from 'fs';

process.on('uncaughtException', (e) => {
  Logger.error(e);
});

//create express app
const app = express();

// security
if (environment !== 'development') app.use(helmet());
app.use(mongoSanitize());
app.disable('x-powered-by');
app.use(
  cors(
    environment === 'development'
      ? corsOptions.development
      : corsOptions.production,
  ),
);

//? JSON parser moved under /v1/index.ts after /webhooks to fix bugs with stripe

app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 50000,
  }),
);

// cdn
app.use('/public', express.static('public'));

app.use(
  '/private',
  permissions([]),
  authentication,
  authorization,
  express.static('private'),
);

// enable trust proxy for rate limiter
app.set('trust proxy', 1);

// routes
app.use('/v1', routerV1);

// catch 404 and forward to error handler
app.use((req, res, next) => next(new NotFoundError()));

try {
  const blackListFile =
    path.join(__dirname, '../blacklist/') + 'blacklist.conf';
  if (!existsSync(blackListFile)) {
    writeFileSync(blackListFile, 'deny 1.2.3.4;');
  }
} catch (err) {
  Logger.error('Something went wrong while creating blacklist.');
}

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
  } else {
    Logger.error(err);

    let buf = '';
    if (req.headers['x-forwarded-for'])
      buf = req.headers['x-forwarded-for'] as string;
    else buf = req.socket.remoteAddress as string;

    const split = buf.split(',');
    buf = split.length ? split[0] : buf;

    const ipAddr = buf;

    const type = (err as any).type as string;
    if (type === 'entity.parse.failed') {
      const blackListFile =
        path.join(__dirname, '../blacklist/') + 'blacklist.conf';
      appendFileSync(blackListFile, `deny ${ipAddr};`);
      Logger.error(`${ipAddr} blocked. Body: ${req.body}`);
    }
    if (environment === 'development') {
      return res.status(500).send(err.message);
    }
    ApiError.handle(new InternalError(), res);
  }
});

export default app;
