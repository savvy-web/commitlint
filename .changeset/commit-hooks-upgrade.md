---
"@savvy-web/commitlint": minor
---

## Features

### Commit message quality hooks

- New `PreToolUse(Bash)` hook auto-allows curated safe commands and routes commit-related Bash invocations through `savvy-commit hook pre-commit-message`. Six rules deny markdown headers and code fences, deny commitlint failures, deny `--no-gpg-sign` when `commit.gpgsign=true`, and advise on plan-file references, soft-wraps inside bullets, body verbosity, and missing `Closes #N` trailers when the branch encodes a ticket.
- New `PreToolUse` matchers auto-allow curated GitHub MCP and GitKraken MCP operations and Read/Write/Edit calls scoped to the project's `.claude/cache/` directory.
- New `PostToolUse(Bash)` hook replays `commitlint --last`, verifies the new HEAD's signature against `commit.gpgsign`, and advises when a branch-implied ticket is missing from the commit body.
- New `UserPromptSubmit` hook injects a compact commit-quality reminder when the prompt mentions commit-related verbs.

### Richer SessionStart context

- SessionStart now ships the existing commit conventions plus a quality charter (forbidden body content, soft-wrap rule, dependency-update guidance), a branch context block (current branch, inferred ticket id, open-issue list), and a GPG / SSH signing diagnostic with key resolution and agent responsiveness checks.

### `savvy-commit hook` CLI subcommand tree

- New internal subcommand tree (`session-start`, `pre-commit-message`, `post-commit-verify`, `user-prompt-submit`) consumed by the companion plugin's bash hooks. Not stable for third-party consumption; surface and JSON shape may change between minor versions until 1.0.
