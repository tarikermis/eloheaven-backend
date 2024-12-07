import { baseColor, notificationCooldown } from '@config';
import SystemRepo from '@database/repository/SystemRepo';
import { sendMessageWithEmbed } from '@core/discord/utils/channelUtils';
import Logger from '@core/Logger';

const servers = {
  lol: ['EUW', 'NA', 'OCE'],
  val: ['EU', 'NA', 'OCE'],
};

const lolTiers = [
  'Iron 4',
  'Iron 3',
  'Iron 2',
  'Iron 1',
  'Bronze 4',
  'Bronze 3',
  'Bronze 2',
  'Bronze 1',
  'Silver 4',
  'Silver 3',
  'Silver 2',
  'Silver 1',
  'Gold 4',
  'Gold 3',
  'Gold 2',
  'Gold 1',
  'Platinum 4',
  'Platinum 3',
  'Platinum 2',
  'Platinum 1',
  'Diamond 4',
  'Diamond 3',
  'Diamond 2',
  'Diamond 1',
  'Master',
];

const valTiers = [
  'Iron 1',
  'Iron 2',
  'Iron 3',
  'Bronze 1',
  'Bronze 2',
  'Bronze 3',
  'Silver 1',
  'Silver 2',
  'Silver 3',
  'Gold 1',
  'Gold 2',
  'Gold 3',
  'Platinum 1',
  'Platinum 2',
  'Platinum 3',
  'Diamond 1',
  'Diamond 2',
  'Diamond 3',
  'Ascendant 1',
  'Ascendant 2',
  'Ascendant 3',
  'Immortal',
];

const boostTypes = ['Elo Boost', 'Duo Boost'];

const agents = [
  'clove',
  'deadlock',
  'cypher',
  'jett',
  'iso',
  'gekko',
  'raze',
  'phoenix',
  'reyna',
];
const lanes = [
  ':lanetop:',
  ':lanejungle:',
  ':lanemid:',
  ':laneadc:',
  ':lanesupport:',
];
const flashKeys = ['D', 'F'];

type Extra =
  | 'soloOnly'
  | 'noStack'
  | 'vpnOn'
  | 'appearOffline'
  | 'streamGames'
  | 'normalizeScore'
  | 'ghostBoost'
  | 'extraWin';

const rules: Record<Extra, Partial<Record<Extra, boolean>>> = {
  soloOnly: {
    normalizeScore: true,
    ghostBoost: false,
  },
  noStack: {},
  vpnOn: {},
  appearOffline: {},
  streamGames: {},
  normalizeScore: { soloOnly: true },
  ghostBoost: { soloOnly: false },
  extraWin: {},
};

const rr = [' (0-25)', ' (26-50)', ' (51-75)', ' (76-100)'];
const lpRanges = [' (0-20)', ' (21-40)', ' (41-60)', ' (61-80)', ' (81-100)'];

const extraDisplayNames: Record<Extra, string> = {
  soloOnly: 'Solo Only',
  noStack: 'No 5 Stack',
  vpnOn: 'VPN On',
  appearOffline: 'Appear Offline',
  streamGames: 'Stream Games',
  normalizeScore: 'Normalize Score',
  ghostBoost: 'Ghost Boost',
  extraWin: 'Extra Win',
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTierRange(tiers: string[]): [string, string] {
  const startTier = getRandomElement(tiers.slice(0, -1)); // Exclude the highest tier
  const startIndex = tiers.indexOf(startTier);

  // Define the probability of allowing a higher number of steps
  const allowHigherStepsProbability = 0.1; // 10% chance
  const maxSteps = Math.random() < allowHigherStepsProbability ? 16 : 8;

  const maxEndIndex = Math.min(startIndex + maxSteps, tiers.length - 1);
  const endTier = getRandomElement(
    tiers.slice(startIndex + 1, maxEndIndex + 1),
  );

  return [startTier, endTier];
}

function getRandomExtras(game: 'lol' | 'val', boostType: string): Extra[] {
  const extras = Object.keys(rules) as Extra[];
  const selectedExtras = new Set<Extra>();

  while (selectedExtras.size < getRandomInterval(0, 3)) {
    const extra = getRandomElement(extras);
    if (game === 'lol' && extra === 'noStack') continue;
    if (boostType === 'Elo Boost' && extra === 'ghostBoost') continue;
    if (boostType === 'Duo Boost' && extra === 'soloOnly') continue;
    if (boostType === 'Duo Boost' && extra === 'vpnOn') continue;
    if (boostType === 'Duo Boost' && extra === 'appearOffline') continue;
    if (boostType === 'Duo Boost' && extra === 'streamGames') continue;
    if (boostType === 'Duo Boost' && extra === 'normalizeScore') continue;
    if (Array.from(selectedExtras).every((e) => rules[e][extra] !== false)) {
      selectedExtras.add(extra);
    }
  }

  return Array.from(selectedExtras);
}

async function generateFakeOrder(game: 'lol' | 'val') {
  const tiers = game === 'lol' ? lolTiers : valTiers;
  const [currentTier, targetTier] = getRandomTierRange(tiers);
  const server = getRandomElement(servers[game]);
  const boostType = getRandomElement(boostTypes);
  const selectedExtras = getRandomExtras(game, boostType);
  const selectedAgents = agents
    .sort(() => 0.5 - Math.random())
    .slice(0, getRandomInterval(3, 5))
    .join(', ');

  const embedFields =
    selectedExtras.length === 0
      ? []
      : [
          {
            name: 'Extras',
            value: selectedExtras
              .map((extra) => `✅ ${extraDisplayNames[extra]}`)
              .join('\n'),
          },
        ];

  if (game === 'lol' && boostType === 'Elo Boost') {
    const primaryLane = getRandomElement(lanes);
    const secondaryLane = getRandomElement(
      lanes.filter((lane) => lane !== primaryLane),
    );
    const flashKey = getRandomElement(flashKeys);

    if (Math.random() > 0.5)
      embedFields.push(
        {
          name: 'Custom Lanes',
          value: `Primary: ${primaryLane}\nSecondary: ${secondaryLane}`,
        },
        {
          name: 'Flash Key',
          value: `:spellflash: ${flashKey}`,
        },
      );
  } else if (
    game === 'val' &&
    boostType === 'Elo Boost' &&
    Math.random() < 0.5
  ) {
    embedFields.push({
      name: 'Champions & Agents',
      value: selectedAgents,
    });
  }

  embedFields.push({
    name: '➡️ More Details',
    value: `[Click here to view](https://eloheaven.gg/dashboard/booster/available-orders)`,
  });

  const embed = {
    title: `${currentTier}${
      game === 'val'
        ? rr[Math.floor(Math.random() * rr.length)]
        : lpRanges[Math.floor(Math.random() * lpRanges.length)]
    } - ${targetTier} | ${server} | ${boostType}`,
    fields: embedFields,
    thumbnail: { url: 'https://eloheaven.gg/img/logo.png' },
    color: parseInt(baseColor.replace('#', ''), 16),
  };

  const settings = await SystemRepo.getSettings();
  let normalChannel: string = settings.lolNotificationChannel;
  let roleToPing = `<@&${settings.lolBoostersRoleId}>`;
  let vipChannel: string = settings.lolVipNotificationChannel;

  if (game === 'val') {
    vipChannel = settings.valVipNotificationChannel;
    normalChannel = settings.valNotificationChannel;
    roleToPing = `<@&${settings.valBoostersRoleId}>`;
  }

  if (vipChannel && roleToPing) {
    sendMessageWithEmbed(vipChannel, roleToPing, embed);
  }

  if (normalChannel && roleToPing) {
    setTimeout(() => {
      sendMessageWithEmbed(normalChannel, roleToPing, embed);
    }, parseInt(notificationCooldown.toString()) * 1000);
  }
  Logger.info(`😈 Sending fake order for ${game}`);
}

function getRandomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function scheduleFakeOrders() {
  const interval = getRandomInterval(2700000, 4200000); // 45 to 70 minutes in milliseconds
  setTimeout(() => {
    generateFakeOrder(Math.random() < 0.5 ? 'lol' : 'val');
    scheduleFakeOrders();
  }, interval);
}
