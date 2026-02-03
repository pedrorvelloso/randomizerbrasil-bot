# CLAUDE.md

## Project Overview

RBR Bot is a Discord bot for the **Randomizer Brasil (RBR)** community. It integrates Discord users with data from the RBR website (https://rbr.watch), allowing community members to register their Twitch accounts and track live streamers.

- **Type:** Hobby/community project
- **Platform:** Discord (slash commands only)
- **Deployment:** Railway (cloud)

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js |
| Discord | discord.js |
| Database | Supabase (@supabase/supabase-js) |
| Package Manager | pnpm |
| Environment | dotenv |
| Linting/Formatting | Biome |

### Forbidden/Avoid

- Do not introduce new technologies without discussing first
- Keep consistency with existing code patterns

## Project Structure

```
src/
├── index.ts                 # Main entry point
├── register-commands.ts     # Command registration script (CI/CD)
├── clear-commands.ts        # Utility to clear registered commands
├── commands/                # One file per command
│   ├── list.ts
│   ├── online.ts
│   ├── twitch.ts
│   ├── mytwitch.ts
│   ├── unlink.ts
│   └── remove.ts
├── lib/                     # Shared utilities
│   ├── discord.ts           # Types & helpers
│   ├── load-commands.ts     # Dynamic command loader
│   ├── logger.ts            # Structured logging
│   ├── supabase.ts          # Database client & functions
│   └── rbr-api.ts           # RBR API integration
└── types/
    └── database.ts          # Database type definitions
```

## Coding Standards

### Naming Conventions

- **Functions/variables:** camelCase
- **Files:** kebab-case (e.g., `load-commands.ts`)
- **Types/Interfaces:** PascalCase

### Command Structure

Every command follows this pattern:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../lib/discord';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('command-name')
    .setDescription('Description here'),
  async execute(interaction: ChatInputCommandInteraction) {
    // Implementation
  },
};
```

### Error Handling

Use the multi-layer error handling pattern:

1. **Command level:** Wrap logic in try-catch, log errors with context
2. **Global level:** Fallback handler in `index.ts` catches unhandled errors
3. **Database level:** Throw errors up, ignore `PGRST116` (no rows found)

```typescript
try {
  // Business logic
} catch (error) {
  logger.error('Failed to [action]', { command: 'name', userId, error: String(error) });
  await interaction.editReply('❌ Ocorreu um erro ao executar este comando.');
}
```

### Logging

Use the structured logger from `src/lib/logger.ts`:

```typescript
import { logger } from '../lib/logger';

logger.info('Action completed', { userId, streamName });
logger.error('Action failed', { error: String(error) });
```

## Bot Behavior

### Language

**The bot ALWAYS responds in Portuguese (pt-BR).** All user-facing messages must be in Portuguese.

### Response Visibility

Commands respond **ephemerally** (only visible to the user) by default. Use `MessageFlags.Ephemeral` unless explicitly told otherwise.

```typescript
await interaction.reply({
  content: 'Mensagem aqui',
  flags: [MessageFlags.Ephemeral],
});
```

### Permissions

- **Admin check:** Users with `BanMembers` permission are considered admins
- Ask before requesting or using crucial Discord permissions

## Data Access

### When to Use What

| Scenario | Use |
|----------|-----|
| Heavy data, needs caching | RBR API (https://rbr.watch/api/*) |
| Light CRUD operations | Direct Supabase |
| Uncertain | **Ask before deciding** |

### Supabase Pattern

All database operations go through `src/lib/supabase.ts`. Do not import Supabase client directly in commands.

```typescript
import { getRunnerBySourceId, createRunner } from '../lib/supabase';
```

### RBR API

Base URL: `https://rbr.watch`

Endpoints used:
- `/api/streamers` - Live streamers with cache timestamp
- `/api/runners` - All registered runners

## Commands

Commands are registered automatically via GitHub Actions when files in `src/commands/` change.

- **Development:** Registers to specific guild (fast, uses `DISCORD_GUILD_ID`)
- **Production:** Registers globally (slower propagation)

## Development

### Scripts

```bash
pnpm dev          # Run with auto-reload (tsx watch)
pnpm build        # Compile TypeScript
pnpm start        # Run compiled code
pnpm register     # Register commands to Discord
pnpm lint         # Check code with Biome linter
pnpm lint:fix     # Fix linting issues automatically
pnpm format       # Check code formatting
pnpm format:fix   # Format code automatically
pnpm check        # Run both lint and format checks
pnpm check:fix    # Fix both lint and format issues
```

### Environment Variables

Check `.env.example` for required variables. Key ones:
- `DISCORD_TOKEN` - Bot token
- `DISCORD_CLIENT_ID` - Application ID
- `DISCORD_GUILD_ID` - Guild for dev command registration
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key

## TODO (Pending Configuration)

- [x] Configure linter (ESLint/Biome) - **Completed: Biome configured**
- [ ] Add test suite
- [x] Implement global vs guild command registration system - **Completed: `/list` and `/online` are global**

## Assistant Behavior

### Explanations

- **Complex code:** Provide detailed explanations
- **Trivial changes:** Keep explanations brief

### Decision Making

- **RBR API vs Supabase:** Ask before choosing
- **Discord permissions:** Ask before requesting crucial ones
- **New patterns/technologies:** Maintain consistency with existing code

### What NOT to Do

- Never respond to users in English (bot messages must be in Portuguese)
- Never make commands public (non-ephemeral) without explicit instruction
- Never bypass the centralized Supabase functions in `src/lib/supabase.ts`
- Never register commands manually in production (use GitHub Actions)
