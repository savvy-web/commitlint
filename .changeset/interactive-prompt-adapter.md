---
"@savvy-web/commitlint": minor
---

Add interactive commit prompt with commitizen adapter

- Add built-in commitizen adapter at `@savvy-web/commitlint/prompt` with `prompter` function
- Use Unicode emojis for terminal display (🤖, ✨, 🐛, etc.)
- Allow simple unordered lists (`-` and `*`) in commit bodies while still rejecting other markdown
- Include full prompt configuration in `CommitlintConfig.silk()` output
- Remove `@commitlint/cz-commitlint` dependency (users can install separately if preferred)
