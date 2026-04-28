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
@test "does NOT match env rm -rf" { run bash "$HOOK" 'env rm -rf foo'; [ "$status" -eq 1 ]; }
@test "does NOT match env curl" { run bash "$HOOK" 'env curl http://example.com'; [ "$status" -eq 1 ]; }
@test "does NOT match env chmod" { run bash "$HOOK" 'env chmod 777 /'; [ "$status" -eq 1 ]; }
@test "matches env VAR=value pnpm run build" { run bash "$HOOK" 'env DEBUG=1 pnpm run build'; [ "$status" -eq 0 ]; }
@test "does NOT match git rm -rf ." { run bash "$HOOK" 'git rm -rf .'; [ "$status" -eq 1 ]; }
@test "does NOT match git rm --force foo" { run bash "$HOOK" 'git rm --force foo'; [ "$status" -eq 1 ]; }
@test "matches git rm --cached foo" { run bash "$HOOK" 'git rm --cached foo'; [ "$status" -eq 0 ]; }
@test "matches git rm path/to/file" { run bash "$HOOK" 'git rm src/foo.ts'; [ "$status" -eq 0 ]; }
@test "does NOT match git stash drop" { run bash "$HOOK" 'git stash drop'; [ "$status" -eq 1 ]; }
@test "does NOT match git stash clear" { run bash "$HOOK" 'git stash clear'; [ "$status" -eq 1 ]; }
@test "matches git stash push" { run bash "$HOOK" 'git stash push -m "wip"'; [ "$status" -eq 0 ]; }
@test "matches git stash pop" { run bash "$HOOK" 'git stash pop'; [ "$status" -eq 0 ]; }
