import { discordToken } from '@config';
import ready from '@core/discord/listeners/ready';

import { Client, GatewayIntentBits } from 'discord.js';
import interactionCreate from '@core/discord/listeners/interactionCreate';

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

ready(client);
interactionCreate(client);

client.login(discordToken);
