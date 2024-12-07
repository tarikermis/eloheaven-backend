import { __clients } from '../../server';
import { ISocket } from 'app-request';
import { ExtendedServer } from '@socket/Server';

export default (socket: ISocket, io: ExtendedServer) => {
  socket.emit('connected');

  if (__clients.find((client) => client.ip === socket.ipAddress)) {
    const index = __clients.findIndex((client) => client.id === socket.id);
    if (index > -1) {
      __clients.splice(index, 1); // remove 1 item only
    }
  }

  __clients.push({
    ip: socket.ipAddress,
    id: socket.id,
    sub: '0',
    role: 'guest',
    connectedRooms: [],
  });

  io.showOnlineBoosterCount();
};
