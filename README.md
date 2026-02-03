# Randomizer Brasil Bot

Discord bot to manage the runners/streamers table in Supabase.

## Stack

- TypeScript (strict mode)
- Node.js
- discord.js v14+
- @supabase/supabase-js
- dotenv
- Biome (linting & formatting)
- pnpm (package manager)

## Commands

### Users

| Command | Description |
|---------|-------------|
| `/twitch <username>` | Register your Twitch account |
| `/mytwitch` | Show your linked Twitch account |
| `/unlink` | Remove your registration |
| `/online` | List currently live streamers |
| `/list` | List all registered runners |

### Admins (ban members permission)

| Command | Description |
|---------|-------------|
| `/twitch <username> [user]` | Register Twitch for another user |
| `/remove <username>` | Remove any registration |

## Setup

### 1. Create Supabase table

```sql
CREATE TABLE runners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_name TEXT NOT NULL UNIQUE,
  source_id TEXT,
  source TEXT DEFAULT 'discord' CHECK (source IN ('discord', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS or use service key
ALTER TABLE runners DISABLE ROW LEVEL SECURITY;
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN=           # Bot token
DISCORD_CLIENT_ID=       # Application ID
DISCORD_GUILD_ID=        # Server ID (optional, for dev)
SUPABASE_URL=            # Supabase project URL
SUPABASE_SERVICE_KEY=    # Supabase service_role key
RBR_API_URL=             # RBR API URL (e.g., https://rbr.watch)
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Register commands

```bash
pnpm register
```

### 5. Start the bot

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start in development mode (auto-reload) |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Start compiled version |
| `pnpm register` | Register slash commands |
| `pnpm clear` | Remove all commands |
| `pnpm lint` | Check code with Biome linter |
| `pnpm lint:fix` | Fix linting issues automatically |
| `pnpm format` | Check code formatting |
| `pnpm format:fix` | Format code automatically |
| `pnpm check` | Run both lint and format checks |
| `pnpm check:fix` | Fix both lint and format issues |

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

- **Linting:** Enforces code quality rules and best practices
- **Formatting:** Maintains consistent code style (2-space indentation, single quotes)
- **Pre-configured:** Run `pnpm check` before committing changes

Configuration is in [biome.json](biome.json).

## Business Rules

- A user can only have one linked Twitch account
- Usernames are unique in the table (case-insensitive)
- Admins can override registrations
- Admins are users with ban members permission
- Users can claim unlinked streams (streams without a Discord user)

## Structure

```
src/
  index.ts              # Entry point
  register-commands.ts  # Script to register commands
  clear-commands.ts     # Script to clear commands
  commands/
    twitch.ts           # /twitch
    mytwitch.ts         # /mytwitch
    unlink.ts           # /unlink
    remove.ts           # /remove
    list.ts             # /list
    online.ts           # /online
  lib/
    supabase.ts         # Supabase client & database functions
    discord.ts          # Bot configuration & types
    rbr-api.ts          # RBR API integration
    load-commands.ts    # Dynamic command loader
    logger.ts           # Structured logging
  types/
    database.ts         # Database type definitions
```
