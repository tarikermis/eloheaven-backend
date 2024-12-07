import { Types } from 'mongoose';
import { ITokens } from 'app-request';
import User from '@models/User';
import { tokenInfo } from '@config';
import JWT, { JwtPayload } from '@core/JWT';
import { AuthFailureError, InternalError } from '@core/ApiError';
import { ApiMessage } from '@common/ApiMessage';

export const getAccessToken = (authorization?: string) => {
  if (!authorization) return false;
  if (!authorization.startsWith('Bearer ')) return false;
  return authorization.split(' ')[1];
};

export const validateTokenData = (payload: JwtPayload): boolean => {
  if (
    !payload ||
    !payload.iss ||
    !payload.sub ||
    !payload.prm ||
    payload.iss !== tokenInfo.issuer ||
    !Types.ObjectId.isValid(payload.sub)
  )
    throw new AuthFailureError(ApiMessage.InvalidAccessToken);
  return true;
};

export const createTokens = async (
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
): Promise<ITokens> => {
  const accessToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      user._id.toString(),
      accessTokenKey,
      tokenInfo.accessTokenValidityDays,
    ),
  );

  if (!accessToken) throw new InternalError();

  const refreshToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      user._id.toString(),
      refreshTokenKey,
      tokenInfo.refreshTokenValidityDays,
    ),
  );

  if (!refreshToken) throw new InternalError();

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  } as ITokens;
};
