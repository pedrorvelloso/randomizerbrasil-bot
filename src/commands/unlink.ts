import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../lib/discord';
import { logger } from '../lib/logger';
import { getRunnerBySourceId, deleteRunnerBySourceId } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Remover sua conta da Twitch vinculada'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ctx = {
      command: 'unlink',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
    };

    logger.info('Command executed', ctx);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerBySourceId(interaction.user.id);

      if (!runner) {
        logger.info('No linked account to unlink', ctx);
        await interaction.editReply({
          content: 'ℹ️ Você não tem uma conta da Twitch vinculada para remover.',
        });
        return;
      }

      await deleteRunnerBySourceId(interaction.user.id);

      logger.info('Account unlinked', { ...ctx, username: runner.stream_name });
      await interaction.editReply({
        content: `✅ Conta da Twitch **${runner.stream_name}** desvinculada com sucesso da sua conta do Discord.`,
      });
    } catch (error) {
      logger.error('Failed to unlink account', { ...ctx, error: String(error) });
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao desvincular sua conta da Twitch. Tente novamente mais tarde.',
      });
    }
  },
};
