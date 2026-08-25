# Project Documentation Bundle

This folder contains the approved product and engineering documentation for the sports-shirt catalog MVP.

## Files

- `PRD.md` — functional product requirements.
- `CLAUDE.md` — persistent instructions for Claude Code / Claude Desktop development sessions.
- `ARCHITECTURE.md` — approved system architecture and boundaries.
- `TASKS.md` — phased implementation backlog.
- `DECISIONS.md` — architecture decision record.
- `.env.example` — expected environment variables without real secrets.

## Recommended first instruction to Claude Code

Read, in this order:

1. `CLAUDE.md`
2. `PRD.md`
3. `ARCHITECTURE.md`
4. `DECISIONS.md`
5. `TASKS.md`

Then begin **Phase 1 — Foundation only**.

Do not implement later phases until the foundation passes lint, typecheck, security checks, migrations, and relevant tests.
