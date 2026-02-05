import type { Client } from 'discord.js';
import Fastify, { type FastifyInstance } from 'fastify';
import { logger } from '../lib/logger';
import { checkGuildMembership } from '../lib/permissions';

const USER_ID_REGEX = /^\d{17,19}$/;

interface InGuildQuery {
  user_id?: string;
}

interface InGuildResponse {
  user_id: string;
  in_guild: boolean;
}

interface ErrorResponse {
  error: string;
}

export function createApiServer(client: Client): FastifyInstance {
  const server = Fastify({
    logger: false,
  });

  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) {
    throw new Error(
      'Missing required environment variable: DISCORD_GUILD_ID for API',
    );
  }

  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // Guild membership check endpoint
  server.get<{
    Querystring: InGuildQuery;
    Reply: InGuildResponse | ErrorResponse;
  }>('/api/in-guild', async (request, reply) => {
    const { user_id: userId } = request.query;

    // Validate user_id
    if (!userId) {
      return reply.status(400).send({ error: 'missing_user_id' });
    }

    if (!USER_ID_REGEX.test(userId)) {
      return reply.status(400).send({ error: 'invalid_user_id' });
    }

    try {
      const result = await checkGuildMembership(client, guildId, userId);

      logger.info('Guild membership check', {
        userId,
        inGuild: result.inGuild,
      });

      return {
        user_id: result.userId,
        in_guild: result.inGuild,
      };
    } catch (error) {
      logger.error('Guild membership check failed', {
        userId,
        error: String(error),
      });

      return reply.status(500).send({ error: 'internal_error' });
    }
  });

  return server;
}

export async function startApiServer(server: FastifyInstance): Promise<string> {
  const host = '0.0.0.0';
  const port = Number.parseInt(process.env.API_PORT || '3000', 10);

  await server.listen({ host, port });

  return `${host}:${port}`;
}
