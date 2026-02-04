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
    const guildCommands = commandModules.filter((cmd) => !cmd.isGlobal);

    console.log(
      `Loaded ${commandModules.length} command(s): ${commandModules.map((c) => c.data.name).join(', ')}`,
    );
    console.log(
      `  Global: ${globalCommands.map((c) => c.data.name).join(', ') || 'none'}`,
    );
    console.log(
      `  Guild-only: ${guildCommands.map((c) => c.data.name).join(', ') || 'none'}`,
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

    // Register guild-only commands to guild (if DISCORD_GUILD_ID is set)
    if (process.env.DISCORD_GUILD_ID && guildCommands.length > 0) {
      const guildCommandsData = guildCommands.map((cmd) => cmd.data.toJSON());
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID),
        { body: guildCommandsData },
      );
      const guildNames = guildCommands.map((c) => c.data.name).join(', ');
      console.log(
        `Registered ${guildCommands.length} guild command(s): ${guildNames}`,
      );
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
