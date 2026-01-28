import 'dotenv/config';
import { Events, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { createClient, ExtendedClient } from './lib/discord';
import { loadCommands } from './lib/load-commands';
import { logger } from './lib/logger';

const client: ExtendedClient = createClient();

// Load and register commands
async function initialize() {
  const commands = await loadCommands();

  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  logger.info('Commands loaded', { count: commands.length, commands: commands.map(c => c.data.name) });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info('Bot started', {
      username: readyClient.user.tag,
      guildCount: readyClient.guilds.cache.size,
    });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn('Unknown command received', {
        command: interaction.commandName,
        userId: interaction.user.id,
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

initialize().catch(error => {
  logger.error('Failed to initialize bot', { error: String(error) });
  process.exit(1);
});
