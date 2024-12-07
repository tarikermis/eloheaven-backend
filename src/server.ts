import 'module-alias/register';
import Logger from '@core/Logger';
import { corsOptions, environment, port } from './config';
import app from './app';
import { SocketClient } from 'app-request';
import { ExtendedServer } from '@socket/Server';

export const __clients: SocketClient[] = [];

export const http = require('http').Server(app);
export const io = new ExtendedServer(
  require('socket.io')(http, {
    pingInterval: 2000,
    pingTimeout: 5000,
    cors:
      environment === 'development'
        ? corsOptions.development
        : corsOptions.production,
  }),
);

http
  .listen(port, function () {
    Logger.info(`🔥 Server listening on port: ${port}`);
  })
  .on('error', (e: any) => Logger.error(e));

import './websocket';
import './bot';
import './redis';
