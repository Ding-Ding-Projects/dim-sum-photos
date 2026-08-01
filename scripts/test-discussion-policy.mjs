import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shared = await readFile(new URL('../memory/SHARED_INSTRUCTIONS.md', import.meta.url), 'utf8');
const feature = await readFile(new URL('../docs/features/operations/discussion-lifecycle.md', import.meta.url), 'utf8');
const autonomous = await readFile(new URL('../docs/features/operations/autonomous-completion.md', import.meta.url), 'utf8');
const codexOrchestration = await readFile(new URL('../docs/features/operations/codex-task-orchestration.md', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
const skill = await readFile(new URL('../skills/agent-global-memory/SKILL.md', import.meta.url), 'utf8');
const bootstrap = await readFile(new URL('../docs/features/memory-sync/auto-bootstrap.md', import.meta.url), 'utf8');
const releases = await readFile(new URL('../docs/features/operations/ci-releases.md', import.meta.url), 'utf8');

const checks = [
  ['rolling progress thread', /one rolling progress Discussion[\s\S]*?`General`/i],
  ['same-thread milestone comments', /post each milestone as a new comment on that same thread[\s\S]*?avoid opening a new thread/i],
  ['comments preferred for progress', /comments are the preferred vehicle for related progress/i],
  ['opening post not rewritten for updates', /do not edit earlier comments into new meaning and do not rewrite the opening post for updates[\s\S]*?short current-status pointer/i],
  ['one changelog per release', /Changelog Announcements are scoped \*\*one Discussion per build or release\*\*[\s\S]*?`Announcements`/i],
  ['pushes stay in the release thread', /post every push, CI verdict, artifact, and correction between builds as \*\*comments on that same thread\*\*/i],
  ['observed remote status', /running, failed, or verified/i],
  ['new pin before prior unpin', /Verify the new pin first[\s\S]*?unpin only the previous changelog/i],
  ['user pins remain untouched', /Never unpin[\s\S]*?user-managed/i],
  ['required-surface capability blocker', /Failures involving Discussions, posting, categories, pinning, or other required GitHub surfaces remain external-state blockers/i],
  ['discussion privacy', /never paste secrets, tokens, credentials, or private data/i],
  ['automation-loop prevention', /Automation-only wiki\/Pages synchronization and Discussion edits do not create another changelog or base-repository push/i],
  ['GitHub Projects conditional use', /Use GitHub Projects for GitHub-hosted repositories when Projects work[\s\S]*?Reuse the best-scoped existing owner or repository Project/i],
  ['single Project item', /one task item[\s\S]*?never create duplicates/i],
  ['Project milestone evidence', /At task start move the owned item to `In Progress`[\s\S]*?rolling Discussion, exact commits, CI runs, releases, and artifacts/i],
  ['evidence-gated Project completion', /Move it to `Done` only when[\s\S]*?required remote proof/i],
  ['Project ownership boundary', /do not rearrange views, rename or delete fields, alter automation, close or move unrelated items/i],
  ['ambiguous Project ownership safety', /If ownership or the intended Project is ambiguous, leave existing state intact/i],
  ['Project failure skip', /record the exact limitation once[\s\S]*?skip all further Project work for that task/i],
  ['Project skip does not block completion', /Project unavailability never blocks implementation, push, handoff, or completion/i],
  ['no keep-going prompt', /Never ask “Want me to keep going\?”/i],
  ['no say-the-word prompt', /“Say the word and I will continue”/i],
  ['informational status updates', /Status updates are informational, not permission checks/i],
  ['automatic next safe step', /automatically take the next safe in-scope step/i],
  ['full implementation boundary', /Continue until the requested behavior is fully implemented[\s\S]*?remote CI\/release\/deployment evidence[\s\S]*?safe cleanup/i],
  ['persistence does not broaden scope', /does not broaden scope or authorize secrets, destructive operations, external communications, purchases, elevated access, or unrelated changes/i],
  ['narrow pause conditions', /Pause and ask only for the narrow information or approval[\s\S]*?safe in-scope alternatives have been exhausted/i],
  ['blocked-work continuation', /When blocked, finish every unblocked in-scope part/i],
  ['outcome rather than proxy', /requested outcome itself—not a proxy/i],
  ['Codex-only task sessions', /Codex task-session orchestration[\s\S]*?This section is Codex-only[\s\S]*?Do not apply it to Claude/i],
  ['authorized useful Codex tasks', /prefer fresh Codex task sessions for substantial, bounded workstreams[\s\S]*?current user explicitly authorizes creating them[\s\S]*?coordination overhead/i],
  ['main chat orchestrates task sessions', /main chat remains the accountable orchestrator[\s\S]*?keeps sending follow-up messages[\s\S]*?verifies and incorporates every returned result/i],
  ['every Codex task runs subagents', /Every Codex task session created under this preference must itself spawn useful subagents/i],
  ['owned Codex tasks close after incorporation', /After the main chat verifies and incorporates[\s\S]*?archive or close that task session[\s\S]*?preserve unrelated, user-owned, and ownership-uncertain tasks/i],
  ['delegation grants no authority', /Delegation grants no new authority[\s\S]*?does not authorize additional access, destructive actions, external communications, secrets, purchases, elevated permissions, or unrelated work/i],
  ['dim-sum release-photo requirement', /Every GitHub Release also attaches at least one real dim-sum photo as a downloadable image asset/i],
  ['release-photo repository source', /Select it only from the verified images already tracked in this repository/i],
  ['ordinary agents never generate images', /Agents never generate new images for ordinary project work/i],
  ['repository is canonical image source', /This repository is the canonical image source for every project/i],
  ['catalog-team generation exception', /Temporary catalog-completion exception:[\s\S]*?active agent assigned to complete this repository's 3,000-image catalog[\s\S]*?partner agents that it explicitly delegates to/i],
  ['catalog-team exception expires', /expires automatically when the strict verifier proves 3,000 records and 3,000 unique images/i],
];

for (const [name, pattern] of checks) {
  assert.match(shared, pattern, `Shared instructions are missing the ${name} contract.`);
}

assert.match(feature, /pushes between builds remain comments on that release thread/i);
assert.match(feature, /ownership uncertainty means leaving it alone/i);
assert.match(feature, /Each milestone is posted as a new comment on that same thread/i);
const projects = await readFile(new URL('../docs/features/operations/github-projects.md', import.meta.url), 'utf8');
assert.match(projects, /represents the active task with one issue-backed or draft item/i);
assert.match(projects, /unrelated items and fields are unchanged/i);
assert.match(projects, /record the exact limitation once[\s\S]*?skip every remaining Project operation/i);
assert.match(projects, /never blocks implementation, push, handoff, or completion/i);
assert.match(workflow, /node \.\/scripts\/test-discussion-policy\.mjs/);
assert.match(autonomous, /Progress messages are informational checkpoints, never requests for permission to resume/i);
assert.match(autonomous, /automatically continue past plans, audits, partial implementations, local tests, commits, pushes, and running remote checks/i);
assert.match(autonomous, /Persistence does not override authorization, access controls, secret-handling rules, destructive-action safeguards/i);
assert.match(codexOrchestration, /This policy applies only in Codex/i);
assert.match(codexOrchestration, /Every Codex delegation task created under this policy must itself spawn useful subagents/i);
assert.match(codexOrchestration, /keeps sending follow-up messages and course corrections/i);
assert.match(codexOrchestration, /archives or closes that owned task[\s\S]*?never archives, closes, renames, or otherwise manages an unrelated, user-owned, or ownership-uncertain task/i);
assert.match(codexOrchestration, /Claude is explicitly excluded because it does not provide Codex task sessions/i);
assert.match(workflow, /Agents never ask whether to keep going when the remaining work is[\s\S]*?already authorized/i);
assert.match(agents, /exact current user message[\s\S]*?lowercase authorization word `jerjer`/i);
assert.match(skill, /exact current user message[\s\S]*?lowercase authorization word `jerjer`/i);
assert.match(bootstrap, /message containing solely `jerjer`/i);
assert.match(bootstrap, /near-miss or embedded-token rejection/i);
assert.match(releases, /selected dim-sum photo attached/i);
assert.match(releases, /Ordinary agents use only verified images already tracked in this repository/i);
assert.match(skill, /verified tracked dim-sum catalog as the only image source for ordinary project work/i);
assert.match(skill, /explicitly delegated partners may generate missing catalog images/i);
assert.match(skill, /In Codex only[\s\S]*?require every created task to spawn useful subagents[\s\S]*?archive or close only the owned task/i);
assert.match(agents, /This section applies only to Codex, not Claude[\s\S]*?Every created Codex delegation task must itself spawn useful subagents/i);
assert.match(workflow, /node "\$GITHUB_WORKSPACE\/scripts\/verify-dim-sum-catalog\.mjs"/);
assert.match(workflow, /dim-sum-release-photo\.png/);
assert.match(workflow, /secrets\.RELEASE_TOKEN \|\| secrets\.ORG_TOKEN \|\| secrets\.GITHUB_TOKEN/);

console.log(`${checks.length + 30}/${checks.length + 30} collaboration, autonomous-completion, Codex-orchestration, release, and image-source policy checks passed.`);
