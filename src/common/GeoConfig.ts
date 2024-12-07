import axios from 'axios';

export const enum CountryCode {
  English = 'english',
  Spanish = 'spanish',
  Ukrainian = 'ukrainian',
  Polish = 'polish',
  French = 'french',
  Russian = 'russian',
  Greek = 'greek',
  Portuguese = 'portuguese',
  Arabic = 'arabic',
  Serbian = 'serbian',
  Italian = 'italian',
  Korean = 'korean',
  Vietnamese = 'vietnamese',
  Turkish = 'turkish',
}

export interface IGeoInfoResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export async function getGeoInfo(
  ipAddr: string,
): Promise<IGeoInfoResponse | null> {
  const base = 'http://ip-api.com/json/';
  const response = await axios.get(base + ipAddr);
  const res = response.data as IGeoInfoResponse;

  if (res.status == 'success') return res;
  return null;
}
