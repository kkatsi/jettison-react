# The Jettison skill

An agent skill that writes React code inside [Jettison](../..): four layers with one-way imports, modules that can be deleted without breaking the build, views that render while hooks orchestrate and services decide, and mutations that own their cache effects.

It carries the doctrine, not the stack — no library is assumed. Point it at a repo and it reads what is already there.

## Install

In Claude Code, as a plugin — versioned, and `/plugin update jettison` pulls changes:

```
/plugin marketplace add kkatsi/jettison-react
/plugin install jettison@kkatsi
```

Or in any of the 77 agents [skills.sh](https://skills.sh) knows, one command from the shell — the current project by default, `-g` for all of them:

```bash
npx skills add kkatsi/jettison-react
```

Or by hand, into `~/.claude/skills/jettison` for every project or `.claude/skills/jettison` for one:

```bash
npx degit kkatsi/jettison-react/skills/jettison ~/.claude/skills/jettison
```

Every route carries the whole folder: `references/` and `assets/` are load-bearing, not decoration. A tool that reads only `SKILL.md` still works, with the references degraded to links.

Verify with `/skills` in Claude Code — `jettison` should be listed.

## Use

It triggers on its own when a change touches `src/`. To be explicit:

- _"add a payouts module"_ — placement, the module shape, the registration lines, and the deletion proof
- _"where does this belong?"_ — the layer, the module, and whether the folder has earned existing
- _"review this diff against the architecture"_ — the ten violations lint cannot see
- _"set Jettison up in this repo"_ — aliases, the lint plugin, the violating fixture, the CI job

## What is in the box

|                                |                                                                     |
| ------------------------------ | ------------------------------------------------------------------- |
| `SKILL.md`                     | the workflow and every rule, including the ones no linter can check |
| `references/data-layer.md`     | endpoints, the three cache classes, cross-module events             |
| `references/setup.md`          | wiring the enforcement into a repo that has none                    |
| `assets/jettison/index.ts`     | the oxlint plugin: layer dependencies and module privacy            |
| `assets/oxlint.jettison.ts`    | the config sections to merge                                        |
| `assets/unregister-module.mjs` | strips a module's registration lines, mechanically                  |

The reasoning behind all of it is [the four chapters](../../docs). MIT, like the rest of the repo.
