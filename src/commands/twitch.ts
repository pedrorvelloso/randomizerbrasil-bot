import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { Command, isAdmin, formatTwitchUrl } from '../lib/discord';
import { logger } from '../lib/logger';
import {
  getRunnerByStreamName,
  getRunnerBySourceId,
  createRunner,
  updateRunner,
  deleteRunnerBySourceId,
} from '../lib/supabase';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Registrar uma conta da Twitch')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Nome de usuário da Twitch para registrar')
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Usuário para registrar (apenas usuários permitidos)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString('username', true).trim().toLowerCase();
    const targetUser = interaction.options.getUser('user');
    const member = interaction.member as GuildMember;
    const userIsAdmin = isAdmin(member);

    const ctx = {
      command: 'twitch',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
      username,
      targetUserId: targetUser?.id,
    };

    logger.info('Command executed', ctx);

    // Validar formato do username (validação básica)
    if (!/^[a-z0-9_]{4,25}$/i.test(username)) {
      logger.warn('Invalid username format', ctx);
      await interaction.reply({
        content: '❌ Formato de usuário da Twitch inválido. Deve ter 4-25 caracteres, apenas letras, números e underscores.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    // Se for para outro usuário, requer admin
    if (targetUser && targetUser.id !== interaction.user.id) {
      if (!userIsAdmin) {
        logger.warn('Non-admin tried to register for another user', ctx);
        await interaction.reply({
          content: '❌ Apenas admins podem registrar contas da Twitch para outros usuários.',
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }
    }

    const sourceId = targetUser?.id ?? interaction.user.id;
    const isForSelf = sourceId === interaction.user.id;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      // Verificar se este username da Twitch já está registrado
      const existingByName = await getRunnerByStreamName(username);

      if (existingByName) {
        // Username já existe
        if (existingByName.source_id === sourceId) {
          logger.info('Username already linked to same user', ctx);
          await interaction.editReply({
            content: `ℹ️ A conta da Twitch **${username}** já está vinculada ${isForSelf ? 'à sua conta' : `ao usuário <@${sourceId}>`}.`,
          });
          return;
        }

        // Admin pode sobrescrever
        if (userIsAdmin) {
          await updateRunner(existingByName.id, {
            source_id: sourceId,
            source: 'discord',
          });
          logger.info('Admin reassigned username', { ...ctx, previousOwner: existingByName.source_id });
          await interaction.editReply({
            content: `✅ Conta da Twitch **${username}** foi reatribuída ${isForSelf ? 'para sua conta' : `para <@${sourceId}>`}.\n${formatTwitchUrl(username)}`,
          });
          return;
        }

        logger.warn('Username already registered by another user', ctx);
        await interaction.editReply({
          content: `❌ O usuário da Twitch **${username}** já está registrado por outro usuário.`,
        });
        return;
      }

      // Verificar se o usuário alvo já tem uma conta vinculada
      const existingByUser = await getRunnerBySourceId(sourceId);

      if (existingByUser) {
        if (userIsAdmin) {
          // Admin pode substituir o registro existente
          await deleteRunnerBySourceId(sourceId);
          await createRunner({
            stream_name: username,
            source_id: sourceId,
            source: 'discord',
          });
          logger.info('Admin replaced existing registration', { ...ctx, previousUsername: existingByUser.stream_name });
          await interaction.editReply({
            content: `✅ Registro anterior (**${existingByUser.stream_name}**) substituído por **${username}** ${isForSelf ? 'na sua conta' : `para <@${sourceId}>`}.\n${formatTwitchUrl(username)}`,
          });
          return;
        }

        logger.warn('User already has a linked account', { ...ctx, existingUsername: existingByUser.stream_name });
        await interaction.editReply({
          content: `❌ ${isForSelf ? 'Você já tem' : `<@${sourceId}> já tem`} uma conta da Twitch vinculada: **${existingByUser.stream_name}**. Use \`/unlink\` primeiro para removê-la.`,
        });
        return;
      }

      // Criar novo registro
      await createRunner({
        stream_name: username,
        source_id: sourceId,
        source: 'discord',
      });

      logger.info('New registration created', ctx);
      await interaction.editReply({
        content: `✅ Conta da Twitch **${username}** vinculada com sucesso ${isForSelf ? 'à sua conta' : `a <@${sourceId}>`}!\n${formatTwitchUrl(username)}`,
      });
    } catch (error) {
      logger.error('Failed to process registration', { ...ctx, error: String(error) });
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
      });
    }
  },
};
