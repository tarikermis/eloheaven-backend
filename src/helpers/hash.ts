import { createHash } from 'crypto';

export const sha256 = (input: string) => {
  return createHash('sha256').update(input).digest('hex');
};

export const sha1sum = (input: string) => {
  return createHash('sha256').update(input).digest('hex').slice(0, 40);
};
