import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function clearCommands() {
  try {
    console.log('Removendo comandos...');

    if (process.env.DISCORD_GUILD_ID) {
      // Clear server commands
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        ),
        { body: [] }
      );
      console.log(`Comandos do servidor ${process.env.DISCORD_GUILD_ID} removidos.`);
    }

    // Clear global commands
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: [] }
    );
    console.log('Comandos globais removidos.');

    console.log('Todos os comandos foram removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao remover comandos:', error);
    process.exit(1);
  }
}

clearCommands();
