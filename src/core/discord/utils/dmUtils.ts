import { client } from '@bot';
import { TextChannel, ChannelType, PermissionFlagsBits } from 'discord.js';
import { OrderModel } from '@database/models/Order';

const cron = require('node-cron');

export const sendChannelMessage = async (
  guildId: string,
  channelName: string,
  messageContent: string,
  userId: string,
  orderId: string,
) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) throw new Error('Guild not found');

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) throw new Error('User not found in guild');
    const order = await OrderModel.findOne({ orderId: Number(orderId) });
    if (!order) return;

    // Check if a channel with the specified name already exists
    let channel = guild.channels.cache.find(
      (c) => c.name === channelName && c.type === ChannelType.GuildText,
    );
    if (!channel) {
      // Channel doesn't exist, create it
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ];
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites,
      });
      if (order.DeletionFlag === false) {
        // Reset the DeletionFlag and flagTime after deleting channels
        const deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() - 2); // 4 hour later

        await order.updateOne({
          $set: { DeletionFlag: true, flagTime: deletionTime },
        });
      }
    }
    // Send a message to the channel
    await (channel as TextChannel).send(messageContent);
  } catch (error) {
    console.error(`Error in sendChannelMessage: ${error}`);
  }
};
export async function deleteDiscordChannel(
  guildId: string,
  channelName: string,
) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = guild.channels.cache.filter(
      (channel) =>
        channel.name === channelName && channel.type === ChannelType.GuildText,
    );

    if (channels.size === 0) {
      console.log(`No channel found with the name: ${channelName}`);
      return;
    }

    for (const channel of channels.values()) {
      await channel.delete();
      console.log(`Deleted channel: ${channelName}`);
    }
  } catch (error) {
    console.error(`Error deleting channel: ${channelName}, Error: ${error}`);
  }
}
