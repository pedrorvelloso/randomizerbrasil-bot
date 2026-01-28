import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from './discord';

export async function loadCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, '../commands');
  const commandFiles = readdirSync(commandsPath).filter(
    file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
  );

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const commandModule = await import(filePath);

    if ('command' in commandModule) {
      commands.push(commandModule.command);
    }
  }

  return commands;
}
