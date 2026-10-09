---
title: "Advanced Skills Concepts in Claude Code"
description: ""
date: "2026-09-28"
tags: ["AI","claude-code"]
published: true
---
A basic agent skill is a `SKILL.md` file with a name and a description. See [Create Agent Skills in Simple Steps](/posts/create-agent-skills) for the starting point.

Skill frontmatter supports many more fields. They control who can invoke a skill, run shell commands before Claude sees the skill content, run a skill on its own model or in its own subagent, and let skills invoke other skills.

Many of these fields also affect context usage. Claude Code loads a listing of skill names and descriptions into context on every turn, whether or not Claude ever invokes a given skill.

![The skill listing, about 1% of the context window, loads on every turn, while a skill's body loads only when invoked. Default skills list a name and description, name-only skills list just the name, and skills with disable-model-invocation aren't listed.](/static/images/skill-listing-context.png)

## Control who invokes a skill

By default, both the user and Claude can invoke any skill. The user can type `/skill-name` to invoke it directly, and Claude can load it automatically when relevant to the conversation. Two frontmatter fields restrict this:

- **`disable-model-invocation: true`**: Only the user can invoke the skill. Use this for workflows with side effects or with timing that needs to stay under manual control, like `/commit`, `/deploy`, or `/release`. If Claude tries to invoke the skill anyway, Claude Code blocks the call.
- **`user-invocable: false`**: Only Claude can invoke the skill. Use this for background knowledge that isn't actionable as a command. Claude Code hides the skill from the `/` menu and doesn't run it when the user types `/name`.

Here's how the two fields affect invocation and context loading:

| Frontmatter | User can invoke | Claude can invoke | When loaded into context |
| :--- | :--- | :--- | :--- |
| (default) | Yes | Yes | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | Yes | No | Description not in context, full skill loads when the user invokes it |
| `user-invocable: false` | No | Yes | Description always in context, full skill loads when Claude invokes it |

_**Because `disable-model-invocation: true` removes the skill from the listing entirely, it also reduces the token cost of every turn.**_

### Override skill visibility from settings

The `skillOverrides` setting controls skill visibility from settings instead of the skill's own frontmatter. Use it for skills whose `SKILL.md` shouldn't be edited, such as ones checked into a shared project repo. The `/skills` menu writes this setting: highlight a skill and press `Space` to cycle states, then `Esc` to save to `.claude/settings.local.json`.

```json
{
  "skillOverrides": {
    "deploy": "off",
    "legacy-notes": "name-only",
    "internal-tools": "user-invocable-only"
  }
}
```

Each key is a skill name and each value is one of four states:

| Value | Listed to Claude | In `/` menu |
| :--- | :--- | :--- |
| `"on"` | Name and description | Yes |
| `"name-only"` | Name only | Yes |
| `"user-invocable-only"` | Hidden | Yes |
| `"off"` | Hidden | Hidden |

A skill that is absent from `skillOverrides` is treated as `"on"`. The `/skills` menu labels `"user-invocable-only"` as `user-only`. Plugin skills are not affected by `skillOverrides`. Manage those through `/plugin` instead.

## Pass arguments to skills

Arguments are available through the `$ARGUMENTS` placeholder. To access individual arguments by position, use `$ARGUMENTS[N]` or the shorter `$N`. Indexes start at 0.

Given `/mycommand one two three`:

```
$0             -> one
$1             -> two
$2             -> three
$3             -> $3            (no corresponding argument, left unchanged)
$ARGUMENTS     -> one two three
$ARGUMENTS[0]  -> one
```

Indexed arguments use shell-style quoting, so wrap multi-word values in quotes to pass them as a single argument. For example, `/mycommand "one two" three` makes `$0` expand to `one two`.

If a skill is invoked with arguments but no placeholder receives them, Claude Code appends `ARGUMENTS: <value>` to the end of the skill content.

### Named arguments

The `arguments` field declares named positional arguments:

```markdown
---
name: commit-with-message
description: Stage files and commit
disable-model-invocation: true
arguments: [files, message]
---

Stage $files and commit with the message: "$message"
```

Running `/commit-with-message "*.js" "refactor login"` expands `$files` to `*.js` and `$message` to `refactor login`. Names map to positions in order. A named placeholder with no matching argument expands to an empty string.

To include a literal `$` before a digit, such as `$1.00` in prose, escape it with a backslash: `\$1.00`.

### Show an argument hint

`argument-hint` shows the expected arguments during autocomplete, such as `argument-hint: [issue-number]` or `argument-hint: [filename] [format]`. The hint only documents the input. It doesn't change how Claude Code parses arguments.

## Pre-approve tools for a skill

The `allowed-tools` field grants permission for the listed tools during the turn that invokes the skill, so Claude can use them without prompting for approval. The grant clears when the next message is sent.

The field does not restrict which tools are available: every tool remains callable, and permission settings still govern tools that are not listed. Deny and ask rules still override `allowed-tools`.

To remove tools from Claude's available pool while a skill is active, list them in `disallowed-tools`. This restriction also clears when the next message is sent.

```yaml
allowed-tools: Read Grep Bash(git add *) Bash(git commit *)
disallowed-tools: AskUserQuestion
```

Tool rules use a space between the command and the wildcard, as in `Bash(git *)`. The colon form `Bash(git:*)` is equivalent, but only at the end of a pattern.

> **Warning**
> Workspace trust doesn't gate `allowed-tools`. Claude Code applies a project skill's `allowed-tools` whenever the skill is invoked, including in a `-p` run in a folder that was never trusted. Review the `allowed-tools` of skills checked into a repository before running Claude Code there.

## Inject dynamic context

The `` !`<command>` `` syntax runs shell commands before the skill content is sent to Claude. The command output replaces the placeholder, so Claude receives actual data, not the command itself.

```markdown
---
name: summarize-changes
description: Summarize uncommitted changes
allowed-tools: Bash
---

## Current diff

!`git diff HEAD`

Summarize the changes above and list anything risky.
```

![Side by side: the skill body as written, with the git diff HEAD placeholder, and the version Claude reads, where the diff output has replaced the placeholder. The command never reaches Claude.](/static/images/skill-injection-render.png)

The inline form is only recognized when `!` appears at the start of a line or immediately after whitespace. In `` KEY=!`cmd` ``, the placeholder stays literal text and the command doesn't run. For multi-line commands, use a fenced code block opened with ` ```! `:

````markdown
```!
node --version
git status --short
```
````

Substitution runs once. Command output is inserted as plain text and is not re-scanned for further `` !`<command>` `` placeholders.

### How injected commands run

Injected commands run the same way as Claude's own shell commands:

- **Working directory**: the session shell's current working directory, which moves when Claude runs `cd`.
- **stderr**: with the default `bash` shell, merged into stdout, so errors show up in the injected text.
- **Timeout**: 2 minutes per command.

### When an injected command fails

A failed command aborts the entire skill invocation, not just its own placeholder. Claude never sees the skill content for that invocation, and Claude Code shows `Shell command failed for pattern "..."`.

With the default `bash` shell, any non-zero exit code is a failure, with one exception: exit code 1 from search and comparison commands such as `grep`, `find`, `diff`, and `git diff` counts as a normal result. Exit codes of 2 or higher fail even for those.

For other commands you expect to exit non-zero, append `|| true`. That doesn't help when the command calls `exit`, because the shell exits before `||` is evaluated:

```
!`echo hello | grep zzz`   # exit 1 from grep, still reaches Claude
!`false || true`           # reaches Claude
!`exit 7 || true`          # still aborts
```

> **Note**
> In testing, a non-interactive run of a skill containing `` !`false` `` produced zero turns, an empty result, and process exit code 0. In non-interactive mode, a failed injection can pass without any visible error.

### Permission checks on injected commands

Injected commands never prompt for permission while the skill renders. Claude Code checks each one against the permission rules first. Outside auto mode, when a command's permission check returns anything other than allow, including a rule that would normally ask, Claude Code aborts the invocation with `Shell command permission check failed for pattern "..."`. To keep an unmatched command from aborting, pre-approve it with `allowed-tools`.

In auto mode, a command that would otherwise need approval doesn't abort the invocation. The skill loads with an instruction telling Claude to run the command first. A forked skill that sets `agent` still aborts.

A rule approves the command, not the file it writes to. Claude Code checks a redirect target against your `Edit` rules, so this invocation aborts even though the rule matches the command:

```yaml
allowed-tools: Bash(echo *)
```

```
!`echo hello > out.txt`   # out.txt isn't allowed, invocation aborts
```

In testing, bare `allowed-tools: Bash` let the same command through.

### Where injected commands don't run

Claude Code never runs injected commands on the local machine in skills synced from a claude.ai account. Those commands reach Claude as literal text, and so do `@` file references. Cloud sessions run them normally.

To turn injection off for skills from user, project, plugin, or additional-directory sources, set `"disableSkillShellExecution": true` in settings. Each command is replaced with `[shell command execution disabled by policy]`. Bundled and managed skills are not affected. The setting is most useful in managed settings, where users cannot override it.

A skill that depends on injected output should include instructions for when that output is missing, so the failure is visible in Claude's response.

## Use string substitutions

Skills support string substitution for dynamic values in the skill content:

| Variable | Description |
| :--- | :--- |
| `${CLAUDE_SESSION_ID}` | The current session ID |
| `${CLAUDE_EFFORT}` | The current effort level |
| `${CLAUDE_SKILL_DIR}` | The directory containing the skill's `SKILL.md` file |
| `${CLAUDE_PROJECT_DIR}` | The project root directory |
| `${CLAUDE_PLUGIN_ROOT}` | The plugin's installation directory. Substituted only in plugin skills |
| `${CLAUDE_PLUGIN_DATA}` | The plugin's persistent data directory, which survives plugin updates. Substituted only in plugin skills |

Claude Code substitutes `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PROJECT_DIR}` in two places: the skill's markdown content, and Bash rules in the `allowed-tools` frontmatter. Using the same variable in both places lets a skill run a bundled script without a permission prompt:

```yaml
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/render.sh *)
```

Injected commands run in whatever directory the session is in, so use these variables for any path that must resolve the same way every time.

## Override the model and effort level

```yaml
model: claude-sonnet-5
effort: high
```

The `model` field sets the model while the skill is active. The override lasts for the rest of the current turn and isn't saved to settings. A session running on Haiku that invokes this skill runs that turn on Sonnet, then returns to Haiku on the next prompt.

`model` accepts the same values as `/model`, or `inherit` to keep the active model. A value excluded by the organization's `availableModels` allowlist isn't used, and the session keeps its current model. With `context: fork`, the value sets the forked subagent's model instead.

The `effort` field overrides the session effort level. Options are `low`, `medium`, `high`, `xhigh`, and `max`. Available levels depend on the model.

## Run skills in a subagent

Add `context: fork` to the frontmatter to run a skill in isolation. Claude Code starts a new subagent of the type set in the `agent` field and gives it the skill content as its prompt. The subagent doesn't see the conversation history, so the skill's instructions have to stand on their own.

```yaml
---
name: deep-research
description: Research a topic across the codebase
context: fork
agent: Explore
background: false
---
```

> **Note**
> Despite the name, a skill with `context: fork` doesn't run in a fork of the current conversation. The subagent starts from the skill content and its agent's system prompt, plus CLAUDE.md and git status unless the agent is Explore or Plan. When the task depends on the conversation so far, fork the conversation instead.

![Despite the name, context: fork doesn't copy your conversation. The subagent starts from the skill content and its agent's prompt, plus CLAUDE.md and git status for most agent types, and sends one result back to your session.](/static/images/skill-fork-context.png)

The `agent` field picks the subagent configuration: a built-in agent (`Explore`, `Plan`, `general-purpose`) or any custom subagent from `.claude/agents/`. If omitted, the skill uses `general-purpose`. `Explore` and `Plan` are read-only, with Write and Edit denied, so a skill forked into them can't edit files.

### Run in the foreground or background

The forked subagent runs in the background by default. Work continues while it runs, and its result arrives in the conversation when it completes. Set `background: false` to instead wait for the result in the turn that invoked the skill.

Claude Code also waits for the result, even without `background: false`, when:

- The session is non-interactive, with the `-p` flag or the Agent SDK
- `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` is set to `1`
- An earlier invocation of the same skill is still running
- A scheduled task fires with the skill as its prompt

A backgrounded fork comes with two limits:

- It runs with the narrower tool set that applies to background subagents. If the skill depends on a tool outside that set, set `background: false`.
- Its edits happen outside the session's checkpoints, so `/rewind` doesn't undo them. Use git to revert them.

> **Warning**
> `context: fork` only makes sense for skills with explicit instructions. If a skill contains guidelines without a task, the subagent receives the guidelines but no actionable prompt, and returns without meaningful output.

See [Subagents: How They Work and When to Use Them](/posts/subagents-in-practice) for more on the cost of delegation.

## Invoke skills from other skills

A skill can instruct Claude to invoke other skills in sequence:

```markdown
---
name: ship
description: Run the release checks in order
disable-model-invocation: true
---

Work through these in order. After each Skill call returns, keep going.

1. Invoke the /lint-check skill.
2. Invoke the /test-suite skill.
3. Invoke the /changelog-draft skill.
4. Report the result of each.
```

The instruction to keep going after each Skill call is required. In testing, the Skill tool returned only a short directive, such as `Execute skill: lint-check`. The invoked skill's content and its injected command output arrived in the next message Claude received. If Claude stops after the tool call, it never sees that content and can report success anyway.

![A Skill call returns only a short directive. The skill's content and injected output arrive in the next message, so Claude has to keep going to see them. If it stops after the call, it can report success without having seen the checks.](/static/images/skill-chaining-turns.png)

Every skill invoked from another skill must be model-invocable, because Claude makes the call. A skill with `disable-model-invocation: true` can start a chain, like `ship` above, but can't be a step within one.

Forked subagents also have the Skill tool, so a skill that invokes other skills can run with `context: fork`.

## Manage the context cost of skills

Claude Code loads a listing of skill names and descriptions into context so Claude knows what's available. The listing's budget scales at 1% of the model's context window. When the listing overflows, Claude Code keeps every name but drops descriptions, starting with the skills invoked least. Each entry's combined `description` and `when_to_use` text is capped at 1,536 characters, so put the key use case first.

When a skill is invoked, its rendered content enters the conversation and stays there across later turns. When the conversation is summarized to free context, Claude Code re-attaches the most recent invocation of each skill:

- It keeps the first 5,000 tokens of each skill.
- Re-attached skills share a combined budget of 25,000 tokens.
- It fills this budget starting from the most recently invoked skill, so older skills can be dropped entirely.

Put the most important instructions near the top of `SKILL.md`, since only the start of a skill survives a summary.

Run `/skill-doctor` to see what each skill costs and how often it gets used.

To reduce the context cost of skills:

- Set `disable-model-invocation: true`, or `"user-invocable-only"` in `skillOverrides`, for skills that only run manually.
- Set `"name-only"` in `skillOverrides` for skills Claude should still find but rarely needs.
- Use `context: fork` for skills that do heavy work, so that work runs outside the main conversation.
