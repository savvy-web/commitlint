# @savvy-web/commitlint

## 0.4.6

### Dependencies

* | [`96542c9`](https://github.com/savvy-web/commitlint/commit/96542c91f583b3ca59b7b3a64ec01aded2d58239) | Dependency    | Type    | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :----- | :----- | -- |
  | @savvy-web/lint-staged                                                                               | devDependency | updated | ^0.6.6 | ^0.7.0 |    |

## 0.4.5

### Refactoring

* [`184c43b`](https://github.com/savvy-web/commitlint/commit/184c43bd1f4d70e0fa8e2d026460de4761067992) Replaced `workspace-tools` with `@savvy-web/silk-effects` and `workspaces-effect` across the CLI command layer. The public API (`CommitlintConfig.silk()`) is unchanged.
* `init` command now uses the `ManagedSection` service for hook marker management instead of direct string manipulation.
* `check` command now delegates to `VersioningStrategy`, `WorkspaceDiscovery`, and `ManagedSection` services from `workspaces-effect`.
* `scopes` detection is now effectful, returning an `Effect` rather than a synchronous array.
* CLI layer composition wires all `silk-effects` and `workspaces-effect` layers at the entry point.
* Deleted `src/detection/versioning.ts` (superseded by `VersioningStrategy` service) and `src/detection/utils.ts` (`findProjectRoot` inlined into `dco.ts`).

### Dependencies

* | [`7ce01c0`](https://github.com/savvy-web/commitlint/commit/7ce01c0e57121a76a6ab39dfd6608686531e3aae) | Dependency    | Type    | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :----- | :----- | -- |
  | @savvy-web/vitest                                                                                    | devDependency | updated | ^1.0.1 | ^1.1.0 |    |

- | [`184c43b`](https://github.com/savvy-web/commitlint/commit/184c43bd1f4d70e0fa8e2d026460de4761067992) | Dependency | Type  | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :---- | :----- | :----- | -- |
  | `@savvy-web/silk-effects`                                                                            | dependency | added | —      | ^0.1.0 |    |
  | `workspaces-effect`                                                                                  | dependency | added | —      | ^0.1.0 |    |

* | [`8abc683`](https://github.com/savvy-web/commitlint/commit/8abc6831466b0da1491caf43fe284f4b5afca314) | Dependency    | Type    | Action | From   | To |
  | :--------------------------------------------------------------------------------------------------- | :------------ | :------ | :----- | :----- | -- |
  | @savvy-web/lint-staged                                                                               | devDependency | updated | ^0.6.5 | ^0.6.6 |    |

## 0.4.4

### Bug Fixes

* [`92f5d91`](https://github.com/savvy-web/commitlint/commit/92f5d9144c6da5de42cd29e94fcecc9b301d8ab6) Pins workspace-tools to 0.41.0 due to breaking change introduced upstream.

### Dependencies

* | [`eca1694`](https://github.com/savvy-web/commitlint/commit/eca16942ed33da3b6bfe14922b0362096e5441dc) | Dependency     | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :------------- | :------ | :------ | :------ | -- |
  | @commitlint/cli                                                                                      | devDependency  | updated | ^20.4.3 | ^20.5.0 |    |
  | @commitlint/config-conventional                                                                      | devDependency  | updated | ^20.4.3 | ^20.5.0 |    |
  | @savvy-web/changesets                                                                                | devDependency  | updated | ^0.5.3  | ^0.7.0  |    |
  | @savvy-web/lint-staged                                                                               | devDependency  | updated | ^0.6.2  | ^0.6.4  |    |
  | @savvy-web/vitest                                                                                    | devDependency  | updated | ^0.3.0  | ^1.0.1  |    |
  | @commitlint/cli                                                                                      | peerDependency | updated | ^20.4.3 | ^20.5.0 |    |
  | @commitlint/config-conventional                                                                      | peerDependency | updated | ^20.4.3 | ^20.5.0 |    |

## 0.4.3

### Dependencies

* | [`be5e7e6`](https://github.com/savvy-web/commitlint/commit/be5e7e6989eec7bb81a9a7bc851df15e4a552fff) | Dependency | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :------ | :------ | :------ | -- |
  | @savvy-web/changesets                                                                                | dependency | updated | ^0.5.1  | ^0.5.3  |    |
  | @savvy-web/lint-staged                                                                               | dependency | updated | ^0.6.0  | ^0.6.2  |    |
  | @savvy-web/rslib-builder                                                                             | dependency | updated | ^0.18.2 | ^0.19.0 |    |
  | @savvy-web/vitest                                                                                    | dependency | updated | ^0.2.1  | ^0.3.0  |    |

## 0.4.2

### Bug Fixes

* [`f1ee488`](https://github.com/savvy-web/commitlint/commit/f1ee4884d94e1f8be5a478cb896527e37e490c73) Migrate Effect dependencies to `catalog:silk` for centralized version management via `@savvy-web/pnpm-plugin-silk`. Adds required transitive peer dependencies (`@effect/cluster`, `@effect/printer`, `@effect/printer-ansi`, `@effect/rpc`, `@effect/sql`). Closes #66.

### Dependencies

* | [`bccdea2`](https://github.com/savvy-web/commitlint/commit/bccdea243ce388fcf4eac041a4850efac31b0d4d) | Dependency | Type    | Action  | From    | To |
  | :--------------------------------------------------------------------------------------------------- | :--------- | :------ | :------ | :------ | -- |
  | @savvy-web/changesets                                                                                | dependency | updated | ^0.4.1  | ^0.5.1  |    |
  | @savvy-web/lint-staged                                                                               | dependency | updated | ^0.5.0  | ^0.6.0  |    |
  | @savvy-web/rslib-builder                                                                             | dependency | updated | ^0.16.0 | ^0.18.2 |    |
  | @savvy-web/vitest                                                                                    | dependency | updated | ^0.2.0  | ^0.2.1  |    |

## 0.4.1

### Bug Fixes

* [`6dde84a`](https://github.com/savvy-web/commitlint/commit/6dde84a24fd3ab5c54d7377206987b039234e90b) Remove injected postinstall script from published package.json. Fixes #62.

### Dependencies

* [`0d6fe25`](https://github.com/savvy-web/commitlint/commit/0d6fe259b813d831ab556fbd218911690f13bd1a) @savvy-web/lint-staged: ^0.4.6 → ^0.5.0
* @savvy-web/rslib-builder: ^0.15.0 → ^0.16.0
* @savvy-web/vitest: ^0.1.0 → ^0.2.0

## 0.4.0

### Features

* [`a8cc358`](https://github.com/savvy-web/commitlint/commit/a8cc358330a804b1d7fecee093e96666da6fc39c) Reverts control of peerDependencies to package

## 0.3.4

### Dependencies

* [`14f936e`](https://github.com/savvy-web/commitlint/commit/14f936e05d71da4019ff389ac0ca918421f543e7) @savvy-web/lint-staged: ^0.4.0 → ^0.4.2
* @savvy-web/rslib-builder: ^0.14.1 → ^0.14.2

## 0.3.3

### Patch Changes

* e4524ff: ## Features
  * Support for @savvy-web/changesets
* 00dffc2: ## Dependencies
  * @savvy-web/rslib-builder: ^0.12.1 → ^0.12.2
* 5a32404: ## Dependencies
  * @savvy-web/rslib-builder: ^0.12.2 → ^0.14.1

## 0.3.2

### Patch Changes

* 71ddb1a: Update dependencies:

  **Dependencies:**

  * @savvy-web/lint-staged: ^0.3.1 → ^0.4.0
  * @savvy-web/rslib-builder: ^0.12.0 → ^0.12.1

## 0.3.1

### Patch Changes

* d106029: Update dependencies:

  **Dependencies:**

  * @savvy-web/lint-staged: ^0.2.2 → ^0.3.1

## 0.3.0

### Minor Changes

* fd8af78: Add managed section pattern to init command hook generation

  The `savvy-commit init` command now uses BEGIN/END markers in the `.husky/commit-msg` hook, allowing users to add custom code above or below the managed block. Re-running `init` updates only the managed section, preserving user customizations. The CI environment check now wraps the managed block in an `if` guard instead of `exit 0`, so user-defined hooks outside the markers still execute in CI. The `check` command now reports managed section status (up-to-date, outdated, or not found).

  Remove auto-detected scope restriction from silk preset

  The silk preset no longer auto-detects workspace package names and enforces them as the only allowed commit scopes. Previously, scopes like `ci`, `deps`, or `docs` would be rejected unless explicitly added via `additionalScopes`. Scopes are now unrestricted by default; users can still provide explicit `scopes` or `additionalScopes` to enforce an allowlist.

## 0.2.1

### Patch Changes

* e00fd8f: Switches to managed dependecies with @savvy-web/pnpm-plugin-silk

## 0.2.0

### Minor Changes

* 92cd2f7: Add interactive commit prompt with commitizen adapter
  * Add built-in commitizen adapter at `@savvy-web/commitlint/prompt` with `prompter` function
  * Use Unicode emojis for terminal display (🤖, ✨, 🐛, etc.)
  * Allow simple unordered lists (`-` and `*`) in commit bodies while still rejecting other markdown
  * Include full prompt configuration in `CommitlintConfig.silk()` output
  * Remove `@commitlint/cz-commitlint` dependency (users can install separately if preferred)

## 0.1.2

### Patch Changes

* 6d18e93: Update husky commit-msg hook template for modern Husky compatibility
  * Remove deprecated `dirname` sourcing (no longer needed in Husky v9+)
  * Add CI environment skip for GitHub Actions
  * Use `git rev-parse --show-toplevel` for reliable repo root detection
  * Update all file path checks to use absolute paths from repo root
  * Fix bun lockfile detection (`bun.lock` instead of `bun.lockb`)
  * Add explicit config path to commitlint command

## 0.1.1

### Patch Changes

* 66f5591: Fix missing type exports and hoist markdownlint-cli2 peer dependencies for CI compatibility

## 0.1.0

### Minor Changes

* 907c2bc: Initial implementation of dynamic commitlint configuration with auto-detection of DCO requirements, workspace scopes, and versioning strategies.
