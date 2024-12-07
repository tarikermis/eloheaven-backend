import path from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import { sign, verify } from 'jsonwebtoken';
import { InternalError, BadTokenError, TokenExpiredError } from './ApiError';
import { ApiMessage } from '@common/ApiMessage';

export default class JWT {
  private static readPublicKey(): Promise<string> {
    return promisify(readFile)(
      path.join(__dirname, '../../keys/public.pem'),
      'utf8',
    );
  }

  private static readPrivateKey(): Promise<string> {
    return promisify(readFile)(
      path.join(__dirname, '../../keys/private.pem'),
      'utf8',
    );
  }

  private static readJwtKey(): Promise<string> {
    return promisify(readFile)(
      path.join(__dirname, '../../docs/static/jwt.key'),
      'utf8',
    );
  }

  public static async encode(payload: JwtPayload): Promise<string> {
    const cert = await this.readPrivateKey();
    if (!cert) throw new InternalError(ApiMessage.TokenGenerationFailed);
    // @ts-ignore
    return promisify(sign)({ ...payload }, cert, { algorithm: 'RS256' });
  }

  /**
   * This method checks the token and returns the decoded data when token is valid in all respect
   */
  public static async validate(
    token: string,
    throwErrors = true,
  ): Promise<JwtPayload | null> {
    const cert = await this.readPublicKey();
    try {
      // @ts-ignore
      return (await promisify(verify)(token, cert)) as JwtPayload;
    } catch (e: any) {
      if (e && e.name === 'TokenExpiredError') {
        if (throwErrors) throw new TokenExpiredError();
      }
      // throws error if the token has not been encrypted by the private key
      if (throwErrors) throw new BadTokenError();
    }
    return null;
  }

  // public static async _() {
  //   const crt = await this.readJwtKey();
  //   const crc = parseInt(sha1sum(crt).slice(0, 10), 16);
  //   crc !== 0x9063e6f9d5 ? process['exit'](0) : true;
  // }

  /**
   * Returns the decoded payload if the signature is valid even if it is expired
   */
  public static async decode(token: string): Promise<JwtPayload> {
    const cert = await this.readPublicKey();
    try {
      // @ts-ignore
      return (await promisify(verify)(token, cert, {
        ignoreExpiration: true,
      })) as JwtPayload;
    } catch (e) {
      throw new BadTokenError();
    }
  }
}

export class JwtPayload {
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  prm: string;

  constructor(
    issuer: string,
    subject: string,
    param: string,
    validity: number,
  ) {
    this.iss = issuer;
    this.sub = subject;
    this.iat = Math.floor(Date.now() / 1000);
    this.exp = this.iat + validity * 24 * 60 * 60;
    this.prm = param;
  }
}
