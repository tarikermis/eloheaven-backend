import { ApiError, ErrorVariant } from '@core/ApiError';
import socketValidator from '@helpers/socketValidator';
import { ExtendedServer } from '@socket/Server';
import { joinRoom, leaveRoom, readMessages } from '@socket/service/chat';
import { ISocket } from 'app-request';
import schema from './_schema';

export const chatRouter = (data: any, socket: ISocket, io: ExtendedServer) => {
  let validate;
  if (data.method) {
    switch (data.method) {
      case 'joinRoom':
        validate = socketValidator(schema.joinRoom, data);
        if (validate !== true)
          return io.notify(socket.id, {
            variant: ErrorVariant.ERROR,
            code: 'bad_request',
          });

        joinRoom(data, socket, io).catch((err) => {
          io.notify(socket.id, err);
        });

        break;

      case 'leaveRoom':
        validate = socketValidator(schema.leaveRoom, data);
        if (validate !== true)
          return io.notify(socket.id, {
            variant: ErrorVariant.ERROR,
            code: 'bad_request',
          });

        leaveRoom(data, socket, io).catch((err) => {
          io.notify(socket.id, err);
        });

        break;

      case 'readMessages':
        validate = socketValidator(schema.readMessages, data);
        if (validate !== true)
          return io.notify(socket.id, {
            variant: ErrorVariant.ERROR,
            code: 'bad_request',
          });

        readMessages(data, socket, io).catch((err) => {
          io.notify(socket.id, err);
        });

        break;
      default:
        break;
    }
  }
};
