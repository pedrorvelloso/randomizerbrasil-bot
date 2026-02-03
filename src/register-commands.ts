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
    const commands = commandModules.map((cmd) => cmd.data.toJSON());

    console.log(
      `Loaded ${commands.length} command(s): ${commandModules.map((c) => c.data.name).join(', ')}`,
    );

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'Missing required environment variable: DISCORD_CLIENT_ID',
      );
    }

    if (process.env.DISCORD_GUILD_ID) {
      // Register commands in a specific server (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID),
        { body: commands },
      );
      console.log(
        `Successfully registered commands to guild ${process.env.DISCORD_GUILD_ID}`,
      );
    } else {
      // Register global commands (may take up to an hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Successfully registered global commands');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
