import {
  type ChatInputCommandInteraction,
  type GuildMember,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { type Command, formatTwitchUrl, isAdmin } from '../lib/discord';
import { logger } from '../lib/logger';
import {
  createRunner,
  deleteRunnerBySourceId,
  getRunnerBySourceId,
  getRunnerByStreamName,
  updateRunner,
} from '../lib/supabase';
import type { Runner } from '../types/database';

interface LogContext {
  command: string;
  userId: string;
  userTag: string;
  guildId?: string;
  username: string;
  targetUserId?: string;
  [key: string]: unknown;
}

interface RegistrationContext {
  username: string;
  sourceId: string;
  isForSelf: boolean;
  isAdmin: boolean;
  ctx: LogContext;
}

interface RegistrationResult {
  message: string;
  logLevel?: 'info' | 'warn';
  logMessage?: string;
  logExtra?: Record<string, unknown>;
}

function validateUsername(username: string): string | null {
  if (!/^[a-z0-9_]{4,25}$/i.test(username)) {
    return '❌ Formato de usuário da Twitch inválido. Deve ter 4-25 caracteres, apenas letras, números e underscores.';
  }
  return null;
}

async function handleExistingUsername(
  existing: Runner,
  context: RegistrationContext,
): Promise<RegistrationResult> {
  const { username, sourceId, isForSelf, isAdmin, ctx } = context;

  // Unlinked stream - anyone can claim
  if (!existing.source_id) {
    await updateRunner(existing.id, { source_id: sourceId, source: 'discord' });
    logger.info('Claimed unlinked stream', ctx);
    return {
      message: `✅ Conta da Twitch **${username}** foi vinculada ${isForSelf ? 'à sua conta' : `a <@${sourceId}>`}!\n${formatTwitchUrl(username)}`,
    };
  }

  // Already linked to same user
  if (existing.source_id === sourceId) {
    logger.info('Username already linked to same user', ctx);
    return {
      message: `ℹ️ A conta da Twitch **${username}** já está vinculada ${isForSelf ? 'à sua conta' : `ao usuário <@${sourceId}>`}.`,
    };
  }

  // Admin can override
  if (isAdmin) {
    await updateRunner(existing.id, { source_id: sourceId, source: 'discord' });
    logger.info('Admin reassigned username', {
      ...ctx,
      previousOwner: existing.source_id,
    });
    return {
      message: `✅ Conta da Twitch **${username}** foi reatribuída ${isForSelf ? 'para sua conta' : `para <@${sourceId}>`}.\n${formatTwitchUrl(username)}`,
    };
  }

  // Blocked - username taken
  logger.warn('Username already registered by another user', ctx);
  return {
    message: `❌ O usuário da Twitch **${username}** já está registrado por outro usuário.`,
  };
}

async function handleExistingUserAccount(
  existing: Runner,
  context: RegistrationContext,
): Promise<RegistrationResult> {
  const { username, sourceId, isForSelf, isAdmin, ctx } = context;

  // Admin can replace existing registration
  if (isAdmin) {
    await deleteRunnerBySourceId(sourceId);
    await createRunner({
      stream_name: username,
      source_id: sourceId,
      source: 'discord',
    });
    logger.info('Admin replaced existing registration', {
      ...ctx,
      previousUsername: existing.stream_name,
    });
    return {
      message: `✅ Registro anterior (**${existing.stream_name}**) substituído por **${username}** ${isForSelf ? 'na sua conta' : `para <@${sourceId}>`}.\n${formatTwitchUrl(username)}`,
    };
  }

  // Blocked - user already has an account
  logger.warn('User already has a linked account', {
    ...ctx,
    existingUsername: existing.stream_name,
  });
  return {
    message: `❌ ${isForSelf ? 'Você já tem' : `<@${sourceId}> já tem`} uma conta da Twitch vinculada: **${existing.stream_name}**. Use \`/unlink\` primeiro para removê-la.`,
  };
}

async function createNewRegistration(
  context: RegistrationContext,
): Promise<RegistrationResult> {
  const { username, sourceId, isForSelf, ctx } = context;

  await createRunner({
    stream_name: username,
    source_id: sourceId,
    source: 'discord',
  });

  logger.info('New registration created', ctx);
  return {
    message: `✅ Conta da Twitch **${username}** vinculada com sucesso ${isForSelf ? 'à sua conta' : `a <@${sourceId}>`}!\n${formatTwitchUrl(username)}`,
  };
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Registrar uma conta da Twitch')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Nome de usuário da Twitch para registrar')
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Usuário para registrar (apenas usuários permitidos)')
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.options
      .getString('username', true)
      .trim()
      .toLowerCase();
    const targetUser = interaction.options.getUser('user');
    const member = interaction.member as GuildMember;
    const userIsAdmin = isAdmin(member);
    const sourceId = targetUser?.id ?? interaction.user.id;
    const isForSelf = sourceId === interaction.user.id;

    const ctx: LogContext = {
      command: 'twitch',
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId ?? undefined,
      username,
      targetUserId: targetUser?.id,
    };

    logger.info('Command executed', ctx);

    // 1. Validate username format
    const validationError = validateUsername(username);
    if (validationError) {
      await interaction.reply({
        content: validationError,
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    // 2. Check admin permission for registering others
    if (!isForSelf && !userIsAdmin) {
      logger.warn('Non-admin tried to register for another user', ctx);
      await interaction.reply({
        content:
          '❌ Apenas admins podem registrar contas da Twitch para outros usuários.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const context: RegistrationContext = {
      username,
      sourceId,
      isForSelf,
      isAdmin: userIsAdmin,
      ctx,
    };

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      // 3. Check if username is already registered
      const existingByName = await getRunnerByStreamName(username);
      if (existingByName) {
        const result = await handleExistingUsername(existingByName, context);
        await interaction.editReply({ content: result.message });
        return;
      }

      // 4. Check if user already has a linked account
      const existingByUser = await getRunnerBySourceId(sourceId);
      if (existingByUser) {
        const result = await handleExistingUserAccount(existingByUser, context);
        await interaction.editReply({ content: result.message });
        return;
      }

      // 5. Create new registration
      const result = await createNewRegistration(context);
      await interaction.editReply({ content: result.message });
    } catch (error) {
      logger.error('Failed to process registration', {
        ...ctx,
        error: String(error),
      });
      await interaction.editReply({
        content:
          '❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
      });
    }
  },
};
