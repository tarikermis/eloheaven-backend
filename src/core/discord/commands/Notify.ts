import {
  CommandInteraction,
  Client,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from 'discord.js';
import { io } from '../../../server';
import { Command } from '../Command';

export const Notify: Command = {
  name: 'notify',
  description: 'Sends notification on website',
  defaultMemberPermissions: 'Administrator',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'to',
      description: 'Recipients',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Vip Boosters',
          value: 'vip_boosters',
        },
        {
          name: 'Normal Boosters',
          value: 'normal_boosters',
        },
        {
          name: 'Everyone',
          value: 'everyone',
        },
      ],
    },
    {
      name: 'message',
      description: 'Message',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'variant',
      description: 'Variant',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Error',
          value: 'error',
        },
        {
          name: 'Primary',
          value: 'primary',
        },
        {
          name: 'Secondary',
          value: 'secondary',
        },
        {
          name: 'Success',
          value: 'success',
        },
        {
          name: 'Warning',
          value: 'warning',
        },
      ],
    },
    {
      name: 'fart',
      description: 'Fart Sound',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Yes',
          value: 'yes',
        },
        {
          name: 'No',
          value: 'no',
        },
      ],
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    const recipients = interaction.options.data[0].value;
    const message = interaction.options.data[1].value;
    const variant = interaction.options.data[2].value;
    const fart = interaction.options.data[3].value;

    const content = `📢 Recipients: ${recipients}\n💬 Message: \`${message}\`\nℹ️ Variant: ${variant}`;

    const notification = {
      variant: variant,
      message: message,
      special_sound: fart === 'yes',
    };

    if (recipients === 'everyone') io.notifyAll(notification as any);
    else io.notify(recipients as string, notification as any);

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};
