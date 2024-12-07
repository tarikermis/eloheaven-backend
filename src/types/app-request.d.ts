import { Request } from 'express';
import IUser from '@models/User';
import { PermissionCode } from '@models/Role';
import IKeystore from '@models/Keystore';
import { Currency } from '@common/Currency';
import { Socket } from 'socket.io';

declare interface IPublicRequest extends Request {
  ipAddress: string;
  currency: Currency;
}

declare interface IRoleRequest extends IPublicRequest {
  requiredPermissions: PermissionCode[];
}

declare interface IProtectedRequest extends IRoleRequest {
  user: IUser;
  accessToken: string;
  keystore: IKeystore;
}

declare interface ITokens {
  accessToken: string;
  refreshToken: string;
}

declare interface ISocket extends Socket {
  connected: boolean;

  ipAddress: string;
  requiredPermissions: PermissionCode[];
  user: IUser;
  accessToken: string;
  keystore: IKeystore;
}

declare interface SocketClient {
  ip: string;
  id: string;
  sub: string;
  role: string;
  connectedRooms: string[];
}
