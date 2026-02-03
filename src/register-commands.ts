import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from './lib/load-commands';

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  throw new Error('Missing required environment variable: DISCORD_TOKEN');
}

const rest = new REST({ version: '10' }).setToken(discordToken);

async function registerCommands() {
  try {
    console.log('Updating application (/) commands...');

    const commandModules = await loadCommands();

    // Separate commands by scope
    const globalCommands = commandModules.filter((cmd) => cmd.isGlobal);
    const allCommands = commandModules.map((cmd) => cmd.data.toJSON());

    console.log(
      `Loaded ${commandModules.length} command(s): ${commandModules.map((c) => c.data.name).join(', ')}`,
    );

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'Missing required environment variable: DISCORD_CLIENT_ID',
      );
    }

    // Register global commands to global endpoint (available in all servers)
    if (globalCommands.length > 0) {
      const globalCommandsData = globalCommands.map((cmd) => cmd.data.toJSON());
      await rest.put(Routes.applicationCommands(clientId), {
        body: globalCommandsData,
      });
      const globalNames = globalCommands.map((c) => c.data.name).join(', ');
      console.log(
        `Registered ${globalCommands.length} global command(s): ${globalNames}`,
      );
    }

    // Register ALL commands to guild (if DISCORD_GUILD_ID is set)
    if (process.env.DISCORD_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID),
        { body: allCommands },
      );
      console.log(
        `Registered ${allCommands.length} command(s) to guild ${process.env.DISCORD_GUILD_ID}`,
      );
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
