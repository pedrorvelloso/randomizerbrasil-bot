import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { Command, isAdmin } from '../lib/discord';
import { getRunnerByStreamName, deleteRunnerByStreamName } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remover um registro da Twitch (apenas admins)')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Nome de usuário da Twitch para remover')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;

    if (!isAdmin(member)) {
      await interaction.reply({
        content: '❌ Este comando está disponível apenas para admins.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const username = interaction.options.getString('username', true).trim().toLowerCase();

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerByStreamName(username);

      if (!runner) {
        await interaction.editReply({
          content: `ℹ️ Nenhum registro encontrado para o usuário da Twitch **${username}**.`,
        });
        return;
      }

      await deleteRunnerByStreamName(username);

      const linkedUser = runner.source_id ? `<@${runner.source_id}>` : 'nenhum usuário vinculado';

      await interaction.editReply({
        content: `✅ Registro de **${runner.stream_name}** removido com sucesso (estava vinculado a ${linkedUser}).`,
      });
    } catch (error) {
      console.error('Erro no comando /remove:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao remover o registro. Tente novamente mais tarde.',
      });
    }
  },
};
