import socketIpAddress from '@helpers/socketIpAddress';
import { ISocket } from 'app-request';
import { io } from './server';
import connect from '@socket/handlers/connect';
import connection from '@socket/handlers/connection';
import authentication from '@core/auth/socket-authentication';
const websocket = io.server.of('/');

websocket.use((socket: ISocket, next) => {
  socketIpAddress(socket, next);
});

websocket.on('connect', (socket: ISocket) => {
  connect(socket, io);
});

websocket
  .use((socket: ISocket, next) => {
    authentication(socket);
    next();
  })
  .on('connection', (socket: ISocket) => {
    connection(socket, io);
  });

export default websocket;
