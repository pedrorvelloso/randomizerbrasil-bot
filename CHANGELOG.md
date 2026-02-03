# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-03

### Added
- `/list` command now shows clickable Twitch links and Discord user mentions
- `/list` command displays last update timestamp
- Users can claim unlinked streams (streams without Discord user) via `/twitch`
- Auto-reload dev script using tsx watch mode
- Graceful shutdown handling for Discord connection

### Changed
- `/list` command uses 🎮 emoji instead of numbered list
- Refactored `/twitch` command into smaller, focused functions for better readability
- Updated all scripts to use tsx instead of ts-node for faster execution
- Translated README.md to English
- Translated all code comments to English

## [1.2.2] - 2026-01-30

### Changed
- Add grey dot emoji (⚪) to `/online` command when no streams are online

## [1.2.1] - 2026-01-30

### Fixed
- GitHub Actions workflow now uses pnpm instead of npm
- Updated workflow to match project's package manager (pnpm-lock.yaml)
- Simplified pnpm script command from `pnpm run register` to `pnpm register`

## [1.2.0] - 2026-01-30

### Added
- New `/online` command to list currently live streamers
- RBR API integration (`src/lib/rbr-api.ts`) for fetching livestream data
- Automatic timestamp check with refetch logic for stale data (>1 minute)
- Environment variable `RBR_API_URL` for configurable API endpoint
- Formatted streamer display with game name and Twitch URL
- Timestamp display showing last data update

## [1.1.0] - 2026-01-30

### Added
- GitHub Actions workflow for automatic command deployment
- Workflow triggers on changes to `src/commands/**` files in main branch
- Automatic Discord slash command registration via CI/CD

## [1.0.0] - Initial Release

### Added
- Discord bot for managing runners/streamers
- Slash commands: `/twitch`, `/mytwitch`, `/unlink`, `/list`, `/remove`
- Supabase integration for data persistence
- Auto-loading command system
- Admin authorization system
