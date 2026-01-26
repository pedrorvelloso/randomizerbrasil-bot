import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { Command, isAdmin, formatTwitchUrl } from '../lib/discord';
import { logger } from '../lib/logger';
import { getAllRunners } from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Listar todos os runners registrados (apenas admins)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;

    const ctx = {
      command: 'list',
      userId: interaction.user.id,
      guildId: interaction.guildId ?? undefined,
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
      const runners = await getAllRunners();

      if (runners.length === 0) {
        logger.info('No runners registered', ctx);
        await interaction.editReply({
          content: 'ℹ️ Nenhum runner está registrado no momento.',
        });
        return;
      }

      logger.info('Runners listed', { ...ctx, count: runners.length });

      const embed = new EmbedBuilder()
        .setTitle('📋 Runners Registrados')
        .setColor(0x9146ff)
        .setFooter({ text: `Total: ${runners.length} runner(s)` })
        .setTimestamp();

      const runnerList = runners.map((runner, index) => {
        const user = runner.source_id ? `<@${runner.source_id}>` : '*manual*';
        return `${index + 1}. [${runner.stream_name}](${formatTwitchUrl(runner.stream_name)}) - ${user}`;
      });

      // Limite de descrição do embed do Discord é 4096 caracteres
      // Dividir em múltiplos embeds se necessário
      const chunks: string[] = [];
      let currentChunk = '';

      for (const line of runnerList) {
        if (currentChunk.length + line.length + 1 > 4000) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + line;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      if (chunks.length === 1) {
        embed.setDescription(chunks[0]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embeds = chunks.map((chunk, i) => {
          const pageEmbed = new EmbedBuilder()
            .setColor(0x9146ff)
            .setDescription(chunk);

          if (i === 0) {
            pageEmbed.setTitle('📋 Runners Registrados');
          }
          if (i === chunks.length - 1) {
            pageEmbed
              .setFooter({ text: `Total: ${runners.length} runner(s)` })
              .setTimestamp();
          }

          return pageEmbed;
        });

        await interaction.editReply({ embeds: embeds.slice(0, 10) }); // Limite do Discord: 10 embeds
      }
    } catch (error) {
      logger.error('Failed to list runners', { ...ctx, error: String(error) });
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao buscar a lista de runners. Tente novamente mais tarde.',
      });
    }
  },
};
