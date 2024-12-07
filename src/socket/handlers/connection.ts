import { ISocket } from 'app-request';
import { ExtendedServer } from '@socket/Server';
import error from './error';
import disconnect from './disconnect';
import { chatRouter } from '@socket/router/chat/_load';

export default (socket: ISocket, io: ExtendedServer) => {
  //Check connection
  socket.on('check_connection', () => socket.emit('connected'));
  socket.on('chat', (data) => chatRouter(data, socket, io));

  socket.on('error', (err) => error(err, socket, io));
  socket.on('disconnect', () => disconnect(socket, io));
};
