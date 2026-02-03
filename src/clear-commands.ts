import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  throw new Error('Missing required environment variable: DISCORD_TOKEN');
}

const rest = new REST({ version: '10' }).setToken(discordToken);

async function clearCommands() {
  try {
    console.log('Clearing commands...');

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'Missing required environment variable: DISCORD_CLIENT_ID',
      );
    }

    if (process.env.DISCORD_GUILD_ID) {
      // Clear server commands
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID),
        { body: [] },
      );
      console.log(
        `Guild commands cleared for server ${process.env.DISCORD_GUILD_ID}`,
      );
    }

    // Clear global commands
    await rest.put(Routes.applicationCommands(clientId), {
      body: [],
    });
    console.log('Global commands cleared.');

    console.log('All commands have been successfully cleared!');
  } catch (error) {
    console.error('Error clearing commands:', error);
    process.exit(1);
  }
}

clearCommands();
