import axios from 'axios';
import { riotApiKey } from '@config';
import IOrder from '@database/models/Order';
import { OrderModel } from '@database/models/Order';

export async function getNewOrPendingOrders() {
  return await OrderModel.find({ state: 'Boosting' });
}

export async function processOrders() {
  try {
    const orders = await getNewOrPendingOrders();
    for (const order of orders) {
      try {
        const gameData = await fetchRiotGameData(order);
        const matchData = await fetchRiotMatchData(order, gameData.puuid);
        const matchDetails = await fetchMatchDetails(
          order,
          matchData,
          gameData.puuid,
        );
        console.log('Match details:', matchDetails);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching new or pending orders:', error);
  }
}

const serverToRegionMap: { [key: string]: string } = {
  euw: 'europe',
  eune: 'europe',
  na: 'americas',
  oce: 'americas',
  jp: 'asia',
  kr: 'asia',
  lan: 'americas',
  las: 'americas',
  tr: 'europe',
  ru: 'europe',
  br: 'americas',
  eu: 'europe',
  latam: 'americas',
};

async function fetchRiotGameData(order: IOrder) {
  if (!order.details || !order.credentials || !order.details.general.server) {
    throw new Error('Missing required order details');
  }

  const { nickname, riotId } = order.credentials;

  if (typeof nickname !== 'string' || typeof riotId !== 'string') {
    throw new Error('Nickname or Riot ID is missing or invalid');
  }

  const serverCode = order.details.general.server;
  const region = serverToRegionMap[serverCode];

  if (!region) {
    throw new Error(`Unsupported server: ${serverCode}`);
  }
  const apiUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    nickname,
  )}/${encodeURIComponent(riotId)}?api_key=${riotApiKey}`;

  try {
    const response = await axios.get(apiUrl);
    if (!response.data.puuid) {
      throw new Error('PUUID not found in response data');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data from Riot Games API:', error);
    throw error;
  }
}

async function fetchRiotMatchData(order: IOrder, puuid: string) {
  const serverCode = order.details.general.server;
  const region =
    serverToRegionMap[serverCode as keyof typeof serverToRegionMap];

  if (!region) {
    throw new Error(`Unsupported server: ${serverCode}`);
  }

  if (!order.createdAt) {
    throw new Error('Order creation date is missing or invalid');
  }
  const startTime = Math.floor(new Date(order.createdAt).getTime() / 1000);
  const matchApiUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
    puuid,
  )}/ids?startTime=${startTime}&api_key=${riotApiKey}`;
  try {
    const matchResponse = await axios.get(matchApiUrl);
    return matchResponse.data;
  } catch (error) {
    console.error('Error fetching match data from Riot Games API:', error);
    throw error;
  }
}

async function fetchMatchDetails(
  order: IOrder,
  data: string,
  targetPuuid: string,
) {
  const serverCode = order.details.general.server;
  const region =
    serverToRegionMap[serverCode as keyof typeof serverToRegionMap];

  try {
    const matchIds = data.split('\n');
    const targetParticipantDetails = [];

    for (const matchId of matchIds) {
      if (matchId) {
        const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(
          matchId,
        )}?api_key=${riotApiKey}`;
        const response = await axios.get(url);
        const matchDetails = response.data;

        const participantDto = matchDetails.info.participants.find(
          (participant: any) => participant.puuid === targetPuuid,
        );
        if (participantDto) {
          targetParticipantDetails.push(participantDto);
        }
      }
    }
    return targetParticipantDetails;
  } catch (error) {
    console.error('Error fetching match details:', error);
  }
}
