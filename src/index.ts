import 'dotenv/config';
import {
  type ChatInputCommandInteraction,
  Events,
  MessageFlags,
} from 'discord.js';
import type { FastifyInstance } from 'fastify';
import { createApiServer, startApiServer } from './api/server';
import { createClient, type ExtendedClient } from './lib/discord';
import { loadCommands } from './lib/load-commands';
import { logger } from './lib/logger';

const client: ExtendedClient = createClient();
let apiServer: FastifyInstance | null = null;

// Load and register commands
async function initialize() {
  const commands = await loadCommands();

  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  logger.info('Commands loaded', {
    count: commands.length,
    commands: commands.map((c) => c.data.name),
  });

  client.once(Events.ClientReady, async (readyClient) => {
    logger.info('Bot started', {
      username: readyClient.user.tag,
      guildCount: readyClient.guilds.cache.size,
    });

    // Start API server after Discord client is ready (if enabled)
    if (process.env.API_ENABLED === 'true') {
      try {
        apiServer = createApiServer(client);
        const address = await startApiServer(apiServer);
        logger.info('API server started', { address });
      } catch (error) {
        logger.error('Failed to start API server', { error: String(error) });
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn('Unknown command received', {
        command: interaction.commandName,
        userId: interaction.user.id,
        userTag: interaction.user.tag,
        guildId: interaction.guildId ?? undefined,
      });
      return;
    }

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      logger.error('Unhandled command error', {
        command: interaction.commandName,
        userId: interaction.user.id,
        userTag: interaction.user.tag,
        guildId: interaction.guildId ?? undefined,
        error: String(error),
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ Ocorreu um erro ao executar este comando!',
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        await interaction.reply({
          content: '❌ Ocorreu um erro ao executar este comando!',
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');

  if (apiServer) {
    await apiServer.close();
  }

  client.destroy();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

initialize().catch((error) => {
  logger.error('Failed to initialize bot', { error: String(error) });
  process.exit(1);
});
