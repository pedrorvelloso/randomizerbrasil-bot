import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { Command, isAdmin } from '../lib/discord';
import { logger } from '../lib/logger';
import { getRunnerByStreamName, deleteRunnerByStreamName } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remover um registro da Twitch (apenas usuários permitidos)')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Nome de usuário da Twitch para remover')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const username = interaction.options.getString('username', true).trim().toLowerCase();

    const ctx = {
      command: 'remove',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
      username,
    };

    logger.info('Command executed', ctx);

    if (!isAdmin(member)) {
      logger.warn('Non-admin tried to use admin command', ctx);
      await interaction.reply({
        content: '❌ Este comando está disponível apenas para admins.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerByStreamName(username);

      if (!runner) {
        logger.info('Registration not found', ctx);
        await interaction.editReply({
          content: `ℹ️ Nenhum registro encontrado para o usuário da Twitch **${username}**.`,
        });
        return;
      }

      await deleteRunnerByStreamName(username);

      const linkedUser = runner.source_id ? `<@${runner.source_id}>` : 'nenhum usuário vinculado';

      logger.info('Registration removed by admin', { ...ctx, removedUserId: runner.source_id });
      await interaction.editReply({
        content: `✅ Registro de **${runner.stream_name}** removido com sucesso (estava vinculado a ${linkedUser}).`,
      });
    } catch (error) {
      logger.error('Failed to remove registration', { ...ctx, error: String(error) });
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao remover o registro. Tente novamente mais tarde.',
      });
    }
  },
};
