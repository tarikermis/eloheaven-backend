import { IPublicRequest } from 'app-request';
import { Response, NextFunction } from 'express';

export default () =>
  (req: IPublicRequest, res: Response, next: NextFunction) => {
    let buf = '';
    if (req.headers['x-forwarded-for'])
      buf = req.headers['x-forwarded-for'] as string;
    else buf = req.socket.remoteAddress as string;

    const split = buf.split(',');
    buf = split.length ? split[0] : buf;

    req.ipAddress = buf;
    next();
  };
