import 'dotenv/config';
import { Events, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { createClient, ExtendedClient } from './lib/discord';
import { command as twitchCommand } from './commands/twitch';
import { command as mytwitchCommand } from './commands/mytwitch';
import { command as unlinkCommand } from './commands/unlink';
import { command as removeCommand } from './commands/remove';
import { command as listCommand } from './commands/list';

const client: ExtendedClient = createClient();

// Register commands
client.commands.set(twitchCommand.data.name, twitchCommand);
client.commands.set(mytwitchCommand.data.name, mytwitchCommand);
client.commands.set(unlinkCommand.data.name, unlinkCommand);
client.commands.set(removeCommand.data.name, removeCommand);
client.commands.set(listCommand.data.name, listCommand);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot pronto! Logado como ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Nenhum comando encontrado para ${interaction.commandName}.`);
    return;
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(`Erro ao executar ${interaction.commandName}:`, error);

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

client.login(process.env.DISCORD_TOKEN);
