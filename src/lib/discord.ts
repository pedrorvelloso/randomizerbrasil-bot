import {
  type ChatInputCommandInteraction,
  Client,
  Collection,
  GatewayIntentBits,
  type GuildMember,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** If true, command is registered globally (available in all servers) */
  isGlobal?: boolean;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

export function createClient(): ExtendedClient {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as ExtendedClient;

  client.commands = new Collection();

  return client;
}

export function isAdmin(member: GuildMember | null): boolean {
  if (!member) return false;

  return member.permissions.has('BanMembers');
}

export function formatTwitchUrl(username: string): string {
  return `https://twitch.tv/${username}`;
}
