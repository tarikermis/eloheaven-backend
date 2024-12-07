import { Types } from 'mongoose';
import { ISocket } from 'app-request';
import JWT from '@core/JWT';
import UserRepo from '@repository/UserRepo';
import KeystoreRepo from '@repository/KeystoreRepo';
import { getAccessToken, validateTokenData } from '@core/auth/utils';
import { __clients } from '../../server';

export default async (socket: ISocket) => {
  const tkn = getAccessToken(socket.handshake.auth.token);
  if (!tkn) {
    socket.emit('authentication_failed', { reason: 'invalid_token' });
    return;
  }
  socket.accessToken = tkn;
  try {
    const payload = await JWT.validate(socket.accessToken, false);

    if (!payload) {
      socket.emit('authentication_failed', { reason: 'invalid_payload' });
      return;
    }

    validateTokenData(payload);

    if (!payload) {
      socket.emit('authentication_failed', {
        reason: 'payload_validation_failed',
      });
      return;
    }

    const user = await UserRepo.findById(new Types.ObjectId(payload.sub));
    if (!user) {
      socket.emit('authentication_failed', {
        reason: 'user_not_found',
      });
      return;
    }
    socket.user = user;

    user.appear = 'online';
    UserRepo.updateInfo(user);

    const keystore = await KeystoreRepo.findforKey(
      socket.user._id,
      payload.prm,
    );
    if (!keystore) {
      socket.emit('authentication_failed', {
        reason: 'keystore_not_found',
      });
      return;
    }
    socket.keystore = keystore;

    const _index = __clients.findIndex((el) => el.id === socket.id);
    __clients[_index].sub = socket.user._id.toString();
    switch (socket.user.role.code) {
      case 'booster':
        __clients[_index].role = 'booster';
        break;
      default:
        __clients[_index].role = 'user';
        break;
    }

    // Connect to booster room if not connected
    if (socket.user.boosterDetails) {
      if (
        socket.user.boosterDetails.vip &&
        !__clients[_index].connectedRooms.includes('vip_boosters')
      ) {
        __clients[_index].connectedRooms.push('vip_boosters');
        socket.join('vip_boosters');
      }

      if (
        !socket.user.boosterDetails.vip &&
        !__clients[_index].connectedRooms.includes('normal_boosters')
      ) {
        __clients[_index].connectedRooms.push('normal_boosters');
        socket.join('normal_boosters');
      }
    }
  } catch (e) {}
};
