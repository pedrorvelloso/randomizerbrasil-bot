import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import type { Command } from '../lib/discord';
import { loadCommands } from '../lib/load-commands';
import { logger } from '../lib/logger';

export const command: Command = {
  isGlobal: true,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Listar comandos disponíveis e suas descrições'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ctx = {
      command: 'help',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
    };

    logger.info('Command executed', ctx);

    try {
      // Load all commands dynamically
      const allCommands = await loadCommands();

      const isInRbrGuild = interaction.guildId === process.env.DISCORD_GUILD_ID;
      const rbrUrl = process.env.RBR_API_URL || 'https://rbr.watch';

      // Filter commands based on context
      const visibleCommands = isInRbrGuild
        ? allCommands
        : allCommands.filter((cmd) => cmd.isGlobal);

      // Build command list
      const commandList = visibleCommands
        .map((cmd) => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
        .join('\n');

      let message = `📖 **Comandos Disponíveis**\n\n${commandList}`;

      // Add RBR link when outside the guild
      if (!isInRbrGuild) {
        message += `\n\n🔗 Para mais informações, visite: ${rbrUrl}`;
      }

      await interaction.reply({
        content: message,
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error) {
      logger.error('Failed to load commands', { ...ctx, error: String(error) });
      await interaction.reply({
        content: '❌ Erro ao carregar lista de comandos.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
