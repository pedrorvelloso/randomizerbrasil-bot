# Randomizer Brasil Bot

Bot do Discord para gerenciar a tabela de runners/streamers no Supabase.

## Stack

- TypeScript
- discord.js v14+
- @supabase/supabase-js
- dotenv

## Comandos

### Usuários

| Comando | Descrição |
|---------|-----------|
| `/twitch <username>` | Registrar sua conta da Twitch |
| `/mytwitch` | Mostrar sua conta da Twitch vinculada |
| `/unlink` | Remover seu registro |

### Admins (permissão de banir membros)

| Comando | Descrição |
|---------|-----------|
| `/twitch <username> [user]` | Registrar Twitch para outro usuário |
| `/remove <username>` | Remover qualquer registro |
| `/list` | Listar todos os runners registrados |

## Configuração

### 1. Criar tabela no Supabase

```sql
CREATE TABLE runners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_name TEXT NOT NULL UNIQUE,
  source_id TEXT,
  source TEXT DEFAULT 'discord' CHECK (source IN ('discord', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS ou usar service key
ALTER TABLE runners DISABLE ROW LEVEL SECURITY;
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
DISCORD_TOKEN=           # Token do bot
DISCORD_CLIENT_ID=       # ID da aplicação
DISCORD_GUILD_ID=        # ID do servidor (opcional, para dev)
SUPABASE_URL=            # URL do projeto Supabase
SUPABASE_SERVICE_KEY=    # Chave service_role do Supabase
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Registrar comandos

```bash
npm run register
```

### 5. Iniciar o bot

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Iniciar em modo desenvolvimento |
| `npm run build` | Compilar TypeScript |
| `npm start` | Iniciar versão compilada |
| `npm run register` | Registrar comandos slash |
| `npm run clear` | Remover todos os comandos |

## Regras de Negócio

- Um usuário só pode ter uma conta da Twitch vinculada
- Usernames são únicos na tabela (case-insensitive)
- Admins podem sobrescrever registros
- Admins são usuários com permissão de banir membros

## Estrutura

```
src/
  index.ts              # Ponto de entrada
  register-commands.ts  # Script para registrar comandos
  clear-commands.ts     # Script para limpar comandos
  commands/
    twitch.ts           # /twitch
    mytwitch.ts         # /mytwitch
    unlink.ts           # /unlink
    remove.ts           # /remove
    list.ts             # /list
  lib/
    supabase.ts         # Cliente Supabase
    discord.ts          # Configuração do bot
  types/
    database.ts         # Tipos do Supabase
```
