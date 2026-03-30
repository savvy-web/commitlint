# @savvy-web/commitlint

## 0.5.0

### Features

* [`4fbd4cd`](https://github.com/savvy-web/commitlint/commit/4fbd4cd0a7bb7a642a572d840ce29007e3cb1442) ### Claude Code Plugin

Add Claude Code sidecar plugin that registers a SessionStart hook to inform AI agents about Silk commit conventions, allowed types, and available CLI tools. Install with:

```bash
# Add the Savvy Web plugin marketplace (one-time setup)
/plugin marketplace add savvy-web/systems

# Install the commitlint plugin for this project
/plugin install commitlint@savvy-web-systems --scope project
```
