import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from './lib/load-commands';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function registerCommands() {
  try {
    console.log('Atualizando comandos (/) da aplicação...');

    const commandModules = await loadCommands();
    const commands = commandModules.map(cmd => cmd.data.toJSON());

    console.log(`Carregados ${commands.length} comando(s): ${commandModules.map(c => c.data.name).join(', ')}`);

    if (process.env.DISCORD_GUILD_ID) {
      // Register commands in a specific server (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands }
      );
      console.log(`Comandos registrados com sucesso no servidor ${process.env.DISCORD_GUILD_ID}`);
    } else {
      // Register global commands (may take up to an hour to propagate)
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
        { body: commands }
      );
      console.log('Comandos globais registrados com sucesso');
    }
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
    process.exit(1);
  }
}

registerCommands();
