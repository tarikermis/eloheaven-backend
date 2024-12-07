import { ISocket } from 'app-request';
import { ExtendedServer } from '@socket/Server';
import { ErrorVariant } from '@core/ApiError';

export default (error: Error, socket: ISocket, io: ExtendedServer) => {
  if (error) {
    io.notify(socket.id, {
      variant: ErrorVariant.ERROR,
      code: error.message,
    });
  }
};
