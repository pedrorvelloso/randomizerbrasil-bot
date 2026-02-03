import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { Command } from '../lib/discord';
import { logger } from '../lib/logger';
import { getRunners } from '../lib/rbr-api';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Listar todos os runners'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ctx = {
      command: 'list',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
    };

    logger.info('Command executed', ctx);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const { data, count, timestamp } = await getRunners();

      if (count === 0) {
        logger.info('No runners registered', ctx);
        await interaction.editReply('ℹ️ Nenhum runner está registrado no momento.');
        return;
      }

      logger.info('Runners listed', { ...ctx, count });

      // Build runner list with Twitch links and Discord users
      const runnerList = data.map((runner) => {
        const link = `[${runner.name}](<https://twitch.tv/${runner.name}>)`;
        const user = runner.source_id ? ` - <@${runner.source_id}>` : '';
        return `🎮 ${link}${user}`;
      });

      // Format timestamp for Discord
      const lastUpdated = Math.floor(new Date(timestamp).getTime() / 1000);
      const message = `📋 **Runners**\n\n${runnerList.join('\n')}\n\n*Total: ${count} runner(s)*\n*Última atualização: <t:${lastUpdated}:f>*`;

      await interaction.editReply(message);
    } catch (error) {
      logger.error('Failed to list runners', { ...ctx, error: String(error) });
      await interaction.editReply('❌ Ocorreu um erro ao buscar a lista de runners. Tente novamente mais tarde.');
    }
  },
};
