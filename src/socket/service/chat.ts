import { ApiMessage } from '@common/ApiMessage';
import { ErrorVariant } from '@core/ApiError';
import { ChatChannel } from '@database/models/Chat';
import ChatRepo from '@database/repository/ChatRepo';
import OrderRepo from '@database/repository/OrderRepo';
import UserRepo from '@database/repository/UserRepo';
import { ExtendedServer } from '@socket/Server';
import { ISocket } from 'app-request';

export const joinRoom = async (
  data: any,
  socket: ISocket,
  io: ExtendedServer,
) => {
  if (!socket.user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.SocketUnauthorized,
    };

  const user = await UserRepo.findById(socket.user._id);
  const order = await OrderRepo.findById(data.orderId);

  if (!user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.UserNotFound,
    };

  if (!order)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.OrderNotFound,
    };

  let room = order._id.toString() + '_' + ChatChannel.General;

  const isCustomer = OrderRepo.isCustomer(order, user);
  const isAdmin = OrderRepo.isAdmin(user);
  const isBooster = OrderRepo.isBooster(order, user);

  if (data.channel === ChatChannel.Management && (isAdmin || isCustomer))
    room = order._id.toString() + '_' + ChatChannel.Management;

  if (isAdmin || isCustomer || isBooster) {
    let as = 'user';
    if (isAdmin) as = 'admin';
    if (isBooster) as = 'booster';
    socket.join(room);
    io.server.to(room).emit('chat', {
      status: 'connected',
      room,
      as,
    });
  } else
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.Unauthorized,
    };
};

export const leaveRoom = async (
  data: any,
  socket: ISocket,
  io: ExtendedServer,
) => {
  if (!socket.user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.SocketUnauthorized,
    };

  const user = await UserRepo.findById(socket.user._id);
  const order = await OrderRepo.findById(data.orderId);

  if (!user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.UserNotFound,
    };

  if (!order)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.OrderNotFound,
    };

  const room = order._id.toString() + '_' + data.channel;

  const isCustomer = OrderRepo.isCustomer(order, user);
  const isAdmin = OrderRepo.isAdmin(user);
  const isBooster = OrderRepo.isBooster(order, user);

  if (isAdmin || isCustomer || isBooster) {
    socket.leave(room);
    io.server.to(room).emit('chat', {
      status: 'disconnected',
      room,
    });
  } else
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.Unauthorized,
    };
};

export const readMessages = async (
  data: any,
  socket: ISocket,
  io: ExtendedServer,
) => {
  if (!socket.user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.SocketUnauthorized,
    };

  const user = await UserRepo.findById(socket.user._id);
  const order = await OrderRepo.findById(data.orderId);

  if (!user)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.UserNotFound,
    };

  if (!order)
    throw {
      variant: ErrorVariant.ERROR,
      code: ApiMessage.OrderNotFound,
    };

  let room = ChatChannel.General;

  const isCustomer = OrderRepo.isCustomer(order, user);
  const isAdmin = OrderRepo.isAdmin(user);
  const isBooster = OrderRepo.isBooster(order, user);

  if (data.channel === ChatChannel.Management && (isAdmin || isCustomer))
    room = ChatChannel.Management;

  if (isCustomer || isBooster) {
    ChatRepo.readMessages(order, user, room);
  }
};
