import { Client } from 'discord.js';
import Logger from '@core/Logger';
import { Commands } from '../Commands';

import { scheduleFakeOrders } from '@core/discord/utils/fakeOrders';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }

    // Register commands
    await client.application.commands.set(Commands);
    scheduleFakeOrders();

    Logger.info(`✅ Logged in as: ${client.user.tag}!`);
  });
};
