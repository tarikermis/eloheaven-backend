import { client } from '@bot';
import { APIEmbed, ChannelType, TextChannel } from 'discord.js';

export const sendMessage = (channelId: string, message: string) => {
  const channel = client.channels.cache.get(channelId);
  if (
    channel &&
    channel.isTextBased() &&
    channel.type === ChannelType.GuildText
  )
    (channel as TextChannel).send(message);
};

export const sendEmbedOnly = (userId: string, msgEmbed?: APIEmbed) => {
  const channel = client.channels.cache.get(userId);
  if (
    channel &&
    channel.isTextBased() &&
    channel.type === ChannelType.GuildText
  ) {
    if (msgEmbed) {
      msgEmbed.timestamp = new Date().toISOString();
      (channel as TextChannel).send({ embeds: [msgEmbed] });
    }
  }
};

export const sendMessageWithEmbed = (
  userId: string,
  content?: string,
  msgEmbed?: APIEmbed,
) => {
  const channel = client.channels.cache.get(userId);
  if (
    channel &&
    channel.isTextBased() &&
    channel.type === ChannelType.GuildText
  ) {
    if (msgEmbed) {
      msgEmbed.timestamp = new Date().toISOString();
      (channel as TextChannel).send({ content, embeds: [msgEmbed] });
    }
  }
};
