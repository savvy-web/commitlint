#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../../lib" && pwd)/match-safe-bash.sh"
}

@test "matches ls" { run bash "$HOOK" 'ls -la'; [ "$status" -eq 0 ]; }
@test "matches git status" { run bash "$HOOK" 'git status'; [ "$status" -eq 0 ]; }
@test "matches gh pr view" { run bash "$HOOK" 'gh pr view 42'; [ "$status" -eq 0 ]; }
@test "matches pnpm exec foo" { run bash "$HOOK" 'pnpm exec vitest run'; [ "$status" -eq 0 ]; }
@test "does NOT match rm -rf" { run bash "$HOOK" 'rm -rf foo'; [ "$status" -eq 1 ]; }
@test "does NOT match curl" { run bash "$HOOK" 'curl https://example.com'; [ "$status" -eq 1 ]; }
@test "does NOT match git push --force" { run bash "$HOOK" 'git push --force origin main'; [ "$status" -eq 1 ]; }
@test "does NOT match pnpm install" { run bash "$HOOK" 'pnpm install'; [ "$status" -eq 1 ]; }
@test "does NOT match npx" { run bash "$HOOK" 'npx some-package'; [ "$status" -eq 1 ]; }
