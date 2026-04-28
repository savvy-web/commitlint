#!/usr/bin/env bats

setup() {
  HOOK="$(cd "${BATS_TEST_DIRNAME}/../../lib" && pwd)/is-commit-related.sh"
}

@test "matches plain git commit" {
  run bash "$HOOK" 'git commit -m "subj"'
  [ "$status" -eq 0 ]
}

@test "matches git commit --amend" {
  run bash "$HOOK" 'git commit --amend --no-edit'
  [ "$status" -eq 0 ]
}

@test "matches gh pr create" {
  run bash "$HOOK" 'gh pr create --title T --body B'
  [ "$status" -eq 0 ]
}

@test "matches gh pr edit --body" {
  run bash "$HOOK" 'gh pr edit 5 --body new'
  [ "$status" -eq 0 ]
}

@test "does not match git status" {
  run bash "$HOOK" 'git status'
  [ "$status" -eq 1 ]
}

@test "does not match unrelated command" {
  run bash "$HOOK" 'ls -la'
  [ "$status" -eq 1 ]
}

@test "matches env-prefixed git commit" {
  run bash "$HOOK" 'env GIT_AUTHOR_DATE=2026-01-01 git commit -m "subj"'
  [ "$status" -eq 0 ]
}

@test "matches env-prefixed gh pr create" {
  run bash "$HOOK" 'env GH_TOKEN=xxx gh pr create --title T --body B'
  [ "$status" -eq 0 ]
}

@test "does not match env-prefixed unrelated command" {
  run bash "$HOOK" 'env DEBUG=1 git status'
  [ "$status" -eq 1 ]
}
