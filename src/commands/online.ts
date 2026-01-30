import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../lib/discord';
import { logger } from '../lib/logger';
import { getStreamers } from '../lib/rbr-api';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('Listar livestreams online'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ctx = {
      command: 'online',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
    };

    logger.info('Command executed', ctx);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const { data, count, timestamp } = await getStreamers();

      if (count === 0) {
        logger.info('No streams online', ctx);
        await interaction.editReply('Nenhuma livestream online no momento.');
        return;
      }

      // Format response with streamer info
      const lines = data.map(s =>
        `**${s.displayName}** - ${s.gameName}\n<${s.twitchUrl}>`
      );

      // Format timestamp for Discord date/time display
      const lastUpdated = Math.floor(new Date(timestamp).getTime() / 1000);

      logger.info('Streams fetched successfully', { ...ctx, count });
      await interaction.editReply({
        content: `🔴 **${count} livestream(s) online:**\n\n${lines.join('\n\n')}\n\n_Atualizado: <t:${lastUpdated}:f>_`
      });
    } catch (error) {
      logger.error('Failed to fetch streamers', { ...ctx, error: String(error) });
      await interaction.editReply('❌ Erro ao buscar livestreams.');
    }
  },
};
