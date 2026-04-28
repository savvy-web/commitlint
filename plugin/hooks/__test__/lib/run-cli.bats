#!/usr/bin/env bats

setup() {
  ROOT="$(cd "${BATS_TEST_DIRNAME}/../../../.." && pwd)"
  RUN_CLI="${ROOT}/plugin/hooks/lib/run-cli.sh"
}

@test "run-cli.sh prints a runner string" {
  out=$(bash "$RUN_CLI")
  [ -n "$out" ]
}

@test "run-cli.sh detects pnpm when pnpm-lock.yaml exists" {
  cd "$ROOT"
  out=$(bash "$RUN_CLI")
  [[ "$out" == *"pnpm exec"* ]]
}
