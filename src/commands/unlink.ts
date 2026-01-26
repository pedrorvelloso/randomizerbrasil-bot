import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../lib/discord';
import { getRunnerBySourceId, deleteRunnerBySourceId } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Remover sua conta da Twitch vinculada'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerBySourceId(interaction.user.id);

      if (!runner) {
        await interaction.editReply({
          content: 'ℹ️ Você não tem uma conta da Twitch vinculada para remover.',
        });
        return;
      }

      await deleteRunnerBySourceId(interaction.user.id);

      await interaction.editReply({
        content: `✅ Conta da Twitch **${runner.stream_name}** desvinculada com sucesso da sua conta do Discord.`,
      });
    } catch (error) {
      console.error('Erro no comando /unlink:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao desvincular sua conta da Twitch. Tente novamente mais tarde.',
      });
    }
  },
};
