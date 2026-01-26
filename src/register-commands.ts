import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { command as twitchCommand } from './commands/twitch';
import { command as mytwitchCommand } from './commands/mytwitch';
import { command as unlinkCommand } from './commands/unlink';
import { command as removeCommand } from './commands/remove';
import { command as listCommand } from './commands/list';

const commands = [
  twitchCommand.data.toJSON(),
  mytwitchCommand.data.toJSON(),
  unlinkCommand.data.toJSON(),
  removeCommand.data.toJSON(),
  listCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function registerCommands() {
  try {
    console.log('Atualizando comandos (/) da aplicação...');

    if (process.env.DISCORD_GUILD_ID) {
      // Registrar comandos em um servidor específico (mais rápido para desenvolvimento)
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands }
      );
      console.log(`Comandos registrados com sucesso no servidor ${process.env.DISCORD_GUILD_ID}`);
    } else {
      // Registrar comandos globais (pode levar até uma hora para propagar)
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
