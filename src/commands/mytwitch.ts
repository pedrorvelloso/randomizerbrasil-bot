import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { type Command, formatTwitchUrl } from '../lib/discord';
import { logger } from '../lib/logger';
import { getRunnerBySourceId } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mytwitch')
    .setDescription('Mostrar sua conta da Twitch vinculada'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ctx = {
      command: 'mytwitch',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
    };

    logger.info('Command executed', ctx);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerBySourceId(interaction.user.id);

      if (!runner) {
        logger.info('No linked account found', ctx);
        await interaction.editReply({
          content:
            'ℹ️ Você não tem uma conta da Twitch vinculada. Use `/twitch <username>` para registrar uma.',
        });
        return;
      }

      const registeredAt = new Date(runner.created_at).toLocaleDateString(
        'pt-BR',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      logger.info('Linked account found', {
        ...ctx,
        username: runner.stream_name,
      });
      await interaction.editReply({
        content: `🎮 Sua conta da Twitch vinculada:\n**${runner.stream_name}**\n${formatTwitchUrl(runner.stream_name)}\n\nRegistrado em: ${registeredAt}`,
      });
    } catch (error) {
      logger.error('Failed to fetch linked account', {
        ...ctx,
        error: String(error),
      });
      await interaction.editReply({
        content:
          '❌ Ocorreu um erro ao buscar sua conta da Twitch. Tente novamente mais tarde.',
      });
    }
  },
};
