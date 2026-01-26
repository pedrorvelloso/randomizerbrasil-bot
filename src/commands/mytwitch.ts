import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command, formatTwitchUrl } from '../lib/discord';
import { getRunnerBySourceId } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mytwitch')
    .setDescription('Mostrar sua conta da Twitch vinculada'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const runner = await getRunnerBySourceId(interaction.user.id);

      if (!runner) {
        await interaction.editReply({
          content: 'ℹ️ Você não tem uma conta da Twitch vinculada. Use `/twitch <username>` para registrar uma.',
        });
        return;
      }

      const registeredAt = new Date(runner.created_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      await interaction.editReply({
        content: `🎮 Sua conta da Twitch vinculada:\n**${runner.stream_name}**\n${formatTwitchUrl(runner.stream_name)}\n\nRegistrado em: ${registeredAt}`,
      });
    } catch (error) {
      console.error('Erro no comando /mytwitch:', error);
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao buscar sua conta da Twitch. Tente novamente mais tarde.',
      });
    }
  },
};
