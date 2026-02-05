import type { Client } from 'discord.js';

export interface MemberCheckResult {
  userId: string;
  inGuild: boolean;
}

export async function checkGuildMembership(
  client: Client,
  guildId: string,
  userId: string,
): Promise<MemberCheckResult> {
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    throw new Error(`Guild ${guildId} not found in cache`);
  }

  const member = await guild.members.fetch(userId).catch(() => null);

  return {
    userId,
    inGuild: member !== null,
  };
}
