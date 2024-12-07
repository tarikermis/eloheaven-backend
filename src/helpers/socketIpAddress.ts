import { ISocket } from 'app-request';

export default (socket: ISocket, next: any) => {
  let buf = '';
  if (socket.handshake.headers['x-forwarded-for'])
    buf = socket.handshake.headers['x-forwarded-for'] as string;
  else buf = '127.0.0.1' as string;

  const split = buf.split(',');
  buf = split.length ? split[0] : buf;

  socket.ipAddress = buf;
  next();
};
