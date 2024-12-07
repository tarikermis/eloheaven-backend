import { recaptchaSecretv2 } from '@config';
import { recaptchaSecretv3 } from '@config';
import axios from 'axios';

export async function verifyCaptchaV2(response: string) {
  const res = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretv2}&response=${response}`,
  );

  if (res.data.success === true) {
    return true;
  }

  return false;
}

export async function verifyCaptchaV3(response: string) {
  const res = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretv3}&response=${response}`,
  );

  if (res.data.success === true && res.data.score > 0.2) {
    return true;
  }

  return false;
}
