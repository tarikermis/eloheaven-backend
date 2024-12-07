import { __clients } from '../../server';
import { ISocket } from 'app-request';
import { ExtendedServer } from '@socket/Server';
import UserRepo from '@database/repository/UserRepo';

export default async (socket: ISocket, io: ExtendedServer) => {
  const index = __clients.findIndex((client) => client.id === socket.id);
  if (index > -1) {
    __clients.splice(index, 1); // remove 1 item only
  }

  if (socket.user) {
    const user = await UserRepo.findById(socket.user._id);
    if (user) {
      user.appear = 'offline';
      UserRepo.updateInfo(user);
    }
  }

  io.showOnlineBoosterCount();
};
