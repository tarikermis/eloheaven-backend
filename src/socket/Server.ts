import { EventName } from '@common/EventName';
import { __clients } from '../server';
import { Server } from 'socket.io';

interface SocketEmitPayload {
  event: string;
  data: any;
}

interface NotificationPayload {
  variant: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  code: string;
  text?: string;
}

export class ExtendedServer {
  server;
  constructor(server: Server) {
    this.server = server;
  }
  broadcast(to: string, payload: SocketEmitPayload) {
    this.server.to(to).emit(payload.event, payload.data);
  }
  broadcastAll(payload: SocketEmitPayload) {
    this.server.emit(payload.event, payload.data);
  }
  notify(to: string, payload: NotificationPayload) {
    this.server.to(to).emit(EventName.ShowNotification, payload);
  }
  notifyAll(payload: NotificationPayload) {
    this.server.emit(EventName.ShowNotification, payload);
  }
  showOnlineBoosterCount() {
    this.broadcastAll({
      event: EventName.BoosterCount,
      data: {
        count:
          __clients.filter((client) => client.role === 'booster').length + 232,
      },
    });
  }
}
