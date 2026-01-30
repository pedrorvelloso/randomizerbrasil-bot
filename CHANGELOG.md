# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
