#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';
type Domain = 'frontend' | 'backend' | 'database' | 'security' | 'devx' | 'docs' | 'unknown';
type Command = 'plan' | 'run';

interface CliArgs {
  command: Command;
  limit: number;
  state: 'open' | 'closed' | 'all';
  base: string;
  worktreeRoot: string;
  execute: boolean;
  comment: boolean;
  createWorktrees: boolean;
  output: string | null;
  stateFile: string;
  maxRetries: number;
  strictGate: boolean;
  workerCommand: string | null;
}

interface GithubLabel {
  name?: string;
}

interface GithubIssue {
  number: number;
  title: string;
  body?: string;
  labels?: GithubLabel[];
  url?: string;
}

interface PlannedIssue extends GithubIssue {
  domain: Domain;
  priority: Priority;
  sharedRisk: boolean;
  agent: string;
  branch: string;
  worktreeName: string;
  worktree: string;
}

interface StateEntry {
  number: number;
  status: 'planned' | 'dispatched' | 'running' | 'failed' | 'done';
  retries: number;
  updatedAt: string;
  agent: string;
  branch: string;
  worktree: string;
  lastError?: string;
  gateFailures?: string[];
}

interface OrchestratorState {
  generatedAt: string;
  baseBranch: string;
  issues: Record<string, StateEntry>;
}

const DEFAULT_BASE_BRANCH = 'dev';
const DEFAULT_WORKTREE_ROOT = '.worktrees';
const DEFAULT_LIMIT = 30;
const DEFAULT_STATE_FILE = '.codex/orchestrator/state.json';

const AGENT_BY_DOMAIN: Record<Domain, string> = {
  frontend: 'cockpit-ux-agent',
  backend: 'audit-persistence-agent',
  database: 'db-migration-agent',
  security: 'security-agent',
  devx: 'devx-tooling-agent',
  docs: 'docs-agent',
  unknown: 'generalist-agent',
};

const PRIORITY_BY_LABEL: Record<string, Priority> = {
  p0: 'P0',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
};

const PRIORITY_RANK: Record<Priority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: 'plan',
    limit: DEFAULT_LIMIT,
    state: 'open',
    base: DEFAULT_BASE_BRANCH,
    worktreeRoot: DEFAULT_WORKTREE_ROOT,
    execute: false,
    comment: false,
    createWorktrees: false,
    output: null,
    stateFile: DEFAULT_STATE_FILE,
    maxRetries: 2,
    strictGate: false,
    workerCommand: null,
  };

  const tokens = argv.slice(2);
  if (tokens[0] && !tokens[0].startsWith('--')) {
    const command = tokens.shift() as Command;
    if (command !== 'plan' && command !== 'run') {
      throw new Error(`Unsupported command: ${command}`);
    }
    args.command = command;
  }

  while (tokens.length > 0) {
    const token = tokens.shift();
    switch (token) {
      case '--limit':
        args.limit = Number(tokens.shift() || DEFAULT_LIMIT);
        break;
      case '--state': {
        const state = (tokens.shift() || 'open') as CliArgs['state'];
        args.state = state;
        break;
      }
      case '--base':
        args.base = tokens.shift() || DEFAULT_BASE_BRANCH;
        break;
      case '--worktree-root':
        args.worktreeRoot = tokens.shift() || DEFAULT_WORKTREE_ROOT;
        break;
      case '--output':
        args.output = tokens.shift() || null;
        break;
      case '--execute':
        args.execute = true;
        break;
      case '--strict-gate':
        args.strictGate = true;
        break;
      case '--comment':
        args.comment = true;
        break;
      case '--create-worktrees':
        args.createWorktrees = true;
        break;
      case '--state-file':
        args.stateFile = tokens.shift() || DEFAULT_STATE_FILE;
        break;
      case '--max-retries':
        args.maxRetries = Number(tokens.shift() || 2);
        break;
      case '--worker-command':
        args.workerCommand = tokens.shift() || null;
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) {
    throw new Error(`Invalid --limit value: ${args.limit}`);
  }
  if (!Number.isFinite(args.maxRetries) || args.maxRetries < 0) {
    throw new Error(`Invalid --max-retries value: ${args.maxRetries}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  npx tsx scripts/orchestrator-manager.ts <plan|run> [options]

Options:
  --state <open|closed|all>      Issue state (default: open)
  --limit <number>               Max issues to scan (default: 30)
  --base <branch>                Base branch for worktrees (default: dev)
  --worktree-root <path>         Worktree root path (default: .worktrees)
  --output <path>                Write markdown plan file
  --execute                      Apply actions (without this, dry-run plan only)
  --strict-gate                  Enforce scope + mandatory verification gate
  --create-worktrees             Create worktree+branch per issue (requires --execute)
  --comment                      Post assignment comment on issue (requires --execute)
  --state-file <path>            Orchestrator state JSON (default: .codex/orchestrator/state.json)
  --max-retries <n>              Max retries before skip on failed item (default: 2)
  --worker-command <template>    Worker command template with placeholders:
                                 {issue} {branch} {worktree} {agent} {domain} {priority}
  --help                         Show help

Examples:
  npx tsx scripts/orchestrator-manager.ts plan --output docs/ops/dispatch-plan.md
  npx tsx scripts/orchestrator-manager.ts run --execute --create-worktrees --comment --strict-gate
`);
}

function ghJson<T>(args: string[]): T {
  const stdout = execFileSync('gh', args, { encoding: 'utf8' });
  return JSON.parse(stdout) as T;
}

function gitText(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function runCommand(command: string, cwd: string): { ok: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    return { ok: true, output };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: message };
  }
}

function detectPriority(issue: GithubIssue): Priority {
  const labels = (issue.labels || []).map((label) => (label.name || '').toLowerCase());
  for (const label of labels) {
    if (PRIORITY_BY_LABEL[label]) {
      return PRIORITY_BY_LABEL[label];
    }
  }

  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  if (/(security|auth|vulnerability|data loss|prod down|outage|incident)/.test(text)) return 'P0';
  if (/(broken|bug|fail|error|critical|blocker)/.test(text)) return 'P1';
  if (/(improve|ux|visual|performance|optimi[sz]e|enhance)/.test(text)) return 'P2';
  return 'P3';
}

function detectDomain(issue: GithubIssue): Domain {
  const labels = (issue.labels || []).map((label) => (label.name || '').toLowerCase());
  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  const joined = `${labels.join(' ')} ${text}`;

  if (/(supabase|postgres|migration|schema|seed|sql|database|db )/.test(joined)) return 'database';
  if (/(frontend|react|ui|ux|component|screen|chart|visual|style|css)/.test(joined)) return 'frontend';
  if (/(security|auth|jwt|rbac|cors|header|waf|audit policy)/.test(joined)) return 'security';
  if (/(backend|api|controller|service|repository|spring)/.test(joined)) return 'backend';
  if (/(pre-commit|hook|tooling|lint|format|ci|workflow)/.test(joined)) return 'devx';
  if (/(docs|documentation|readme|guide)/.test(joined)) return 'docs';
  return 'unknown';
}

function hasSharedFileRisk(issue: GithubIssue): boolean {
  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  return /(package\.json|lockfile|application\.yml|vite\.config|shared type|global type|auth middleware|env)/.test(text);
}

function isConflict(a: PlannedIssue, b: PlannedIssue): boolean {
  if (a.sharedRisk || b.sharedRisk) return true;
  if (a.domain === 'unknown' || b.domain === 'unknown') return true;
  if (a.domain === b.domain) return true;
  const riskyPair = new Set(['backend:database', 'database:backend', 'security:backend', 'backend:security']);
  return riskyPair.has(`${a.domain}:${b.domain}`);
}

function allocateBatches(items: PlannedIssue[]): PlannedIssue[][] {
  const batches: PlannedIssue[][] = [];
  for (const item of items) {
    let assigned = false;
    for (const batch of batches) {
      if (!batch.some((existing) => isConflict(existing, item))) {
        batch.push(item);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      batches.push([item]);
    }
  }
  return batches;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'slice';
}

function planToMarkdown(batches: PlannedIssue[][], options: CliArgs): string {
  const lines: string[] = [];
  lines.push('# Orchestrator Dispatch Plan');
  lines.push('');
  lines.push(`- generatedAt: ${new Date().toISOString()}`);
  lines.push(`- baseBranch: ${options.base}`);
  lines.push(`- totalIssues: ${batches.reduce((sum, batch) => sum + batch.length, 0)}`);
  lines.push(`- totalBatches: ${batches.length}`);
  lines.push('');

  batches.forEach((batch, index) => {
    lines.push(`## Batch ${index + 1} (${batch.length} issue${batch.length > 1 ? 's' : ''})`);
    lines.push('');
    lines.push('| Issue | Priority | Domain | Agent | Branch | Worktree |');
    lines.push('|---|---|---|---|---|---|');
    for (const item of batch) {
      lines.push(
        `| #${item.number} | ${item.priority} | ${item.domain} | ${item.agent} | \`${item.branch}\` | \`${item.worktree}\` |`
      );
    }
    lines.push('');
  });

  return lines.join('\n');
}

function stateToMarkdown(state: OrchestratorState): string {
  const lines: string[] = [];
  lines.push('# Orchestrator Run State');
  lines.push('');
  lines.push(`- generatedAt: ${state.generatedAt}`);
  lines.push(`- baseBranch: ${state.baseBranch}`);
  lines.push('');
  lines.push('| Issue | Status | Retries | Agent | Branch | LastError |');
  lines.push('|---|---|---:|---|---|---|');
  for (const entry of Object.values(state.issues).sort((a, b) => a.number - b.number)) {
    lines.push(
      `| #${entry.number} | ${entry.status} | ${entry.retries} | ${entry.agent} | \`${entry.branch}\` | ${
        entry.lastError ? entry.lastError.replace(/\|/g, '\\|') : ''
      } |`
    );
  }
  lines.push('');
  return lines.join('\n');
}

function postAssignmentComment(item: PlannedIssue): void {
  const body = [
    '## 에이전트 배정 (오케스트레이터 자동화)',
    `- 우선순위: \`${item.priority}\``,
    `- 도메인: \`${item.domain}\``,
    `- 담당 에이전트: \`${item.agent}\``,
    `- 작업 브랜치: \`${item.branch}\``,
    `- 워킹트리: \`${item.worktree}\``,
    '',
    '### 고정 핸드오프 형식',
    '- 변경 파일 목록',
    '- 검증 결과',
    '- 남은 리스크',
  ].join('\n');

  execFileSync('gh', ['issue', 'comment', String(item.number), '--body', body], { stdio: 'inherit' });
}

function ensureWorktree(item: PlannedIssue, baseBranch: string, worktreeRoot: string): void {
  const existing = execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' });
  if (existing.includes(path.resolve(worktreeRoot, item.worktreeName))) {
    return;
  }

  execFileSync(
    'git',
    ['worktree', 'add', path.join(worktreeRoot, item.worktreeName), '-b', item.branch, `origin/${baseBranch}`],
    { stdio: 'inherit' }
  );
}

async function loadState(stateFile: string, baseBranch: string): Promise<OrchestratorState> {
  try {
    const raw = await fs.readFile(stateFile, 'utf8');
    return JSON.parse(raw) as OrchestratorState;
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      baseBranch,
      issues: {},
    };
  }
}

async function saveState(stateFile: string, state: OrchestratorState): Promise<void> {
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

function replaceTemplate(template: string, issue: PlannedIssue): string {
  return template
    .replaceAll('{issue}', String(issue.number))
    .replaceAll('{branch}', issue.branch)
    .replaceAll('{worktree}', issue.worktree)
    .replaceAll('{agent}', issue.agent)
    .replaceAll('{domain}', issue.domain)
    .replaceAll('{priority}', issue.priority);
}

function listWorktreeChangedFiles(worktreeAbsPath: string): string[] {
  const output = execFileSync('git', ['-C', worktreeAbsPath, 'status', '--porcelain'], { encoding: 'utf8' });
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => line.slice(3).trim().replaceAll('\\', '/'));
}

function isAllowedPath(domain: Domain, file: string): boolean {
  const pathNormalized = file.replaceAll('\\', '/');
  if (domain === 'frontend') {
    return (
      pathNormalized.startsWith('frontend/') ||
      pathNormalized.startsWith('docs/dev-logs/') ||
      pathNormalized.startsWith('docs/ops/')
    );
  }
  if (domain === 'backend' || domain === 'security') {
    return (
      pathNormalized.startsWith('backend/') ||
      pathNormalized.startsWith('docs/dev-logs/') ||
      pathNormalized.startsWith('docs/ops/')
    );
  }
  if (domain === 'database') {
    return (
      pathNormalized.startsWith('supabase/') ||
      pathNormalized.startsWith('backend/src/main/java/com/costwise/config/') ||
      pathNormalized.startsWith('docs/dev-logs/') ||
      pathNormalized.startsWith('docs/ops/')
    );
  }
  if (domain === 'devx') {
    return (
      pathNormalized.startsWith('scripts/') ||
      pathNormalized.startsWith('.githooks/') ||
      pathNormalized.startsWith('.github/') ||
      pathNormalized.startsWith('docs/')
    );
  }
  if (domain === 'docs') {
    return pathNormalized.startsWith('docs/');
  }
  return false;
}

function mandatoryVerification(domain: Domain, worktreeAbsPath: string): Array<{ name: string; command: string; cwd: string }> {
  const frontendRoot = path.join(worktreeAbsPath, 'frontend');
  const backendRoot = path.join(worktreeAbsPath, 'backend');

  if (domain === 'frontend') {
    return [
      { name: 'frontend-lint', command: 'npm run lint', cwd: frontendRoot },
      { name: 'frontend-build', command: 'npm run build', cwd: frontendRoot },
    ];
  }
  if (domain === 'backend' || domain === 'security') {
    return [
      { name: 'backend-check', command: '.\\gradlew.bat check', cwd: backendRoot },
    ];
  }
  if (domain === 'database') {
    return [
      { name: 'backend-check', command: '.\\gradlew.bat check', cwd: backendRoot },
    ];
  }
  return [];
}

function runGate(issue: PlannedIssue, args: CliArgs): { ok: boolean; failures: string[] } {
  const worktreeAbsPath = path.resolve(issue.worktree);
  const failures: string[] = [];

  const changedFiles = listWorktreeChangedFiles(worktreeAbsPath);
  const outOfScope = changedFiles.filter((file) => !isAllowedPath(issue.domain, file));
  if (outOfScope.length > 0) {
    failures.push(`out-of-scope files: ${outOfScope.join(', ')}`);
  }

  const checks = mandatoryVerification(issue.domain, worktreeAbsPath);
  for (const check of checks) {
    const result = runCommand(check.command, check.cwd);
    if (!result.ok) {
      failures.push(`${check.name} failed`);
    }
  }

  return { ok: failures.length === 0, failures };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const currentBranch = gitText(['branch', '--show-current']);
  const issues = ghJson<GithubIssue[]>([
    'issue',
    'list',
    '--state',
    args.state,
    '--limit',
    String(args.limit),
    '--json',
    'number,title,body,labels,url',
  ]);

  const normalized = issues
    .map<PlannedIssue>((issue) => {
      const domain = detectDomain(issue);
      const priority = detectPriority(issue);
      const sharedRisk = hasSharedFileRisk(issue);
      const slug = slugify(issue.title);
      const branch = `feat/${issue.number}-${slug}`;
      const worktreeName = `feat-${issue.number}-${slug}`;
      return {
        ...issue,
        domain,
        priority,
        sharedRisk,
        agent: AGENT_BY_DOMAIN[domain] || AGENT_BY_DOMAIN.unknown,
        branch,
        worktreeName,
        worktree: path.join(args.worktreeRoot, worktreeName),
      };
    })
    .sort((a, b) => {
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.number - b.number;
    });

  const batches = allocateBatches(normalized);
  const markdown = planToMarkdown(batches, args);

  if (args.command === 'plan' && args.output) {
    await fs.mkdir(path.dirname(args.output), { recursive: true });
    await fs.writeFile(args.output, `${markdown}\n`, 'utf8');
    console.log(`Plan written: ${args.output}`);
  }

  console.log(markdown);

  if (args.command === 'plan') {
    return;
  }

  if (!args.execute) {
    const previewState: OrchestratorState = {
      generatedAt: new Date().toISOString(),
      baseBranch: args.base,
      issues: Object.fromEntries(
        normalized.map((item) => [
          String(item.number),
          {
            number: item.number,
            status: 'planned',
            retries: 0,
            updatedAt: new Date().toISOString(),
            agent: item.agent,
            branch: item.branch,
            worktree: item.worktree,
          } satisfies StateEntry,
        ])
      ),
    };

    const previewPath = args.output || 'docs/ops/orchestrator-run-state.md';
    await fs.mkdir(path.dirname(previewPath), { recursive: true });
    await fs.writeFile(previewPath, `${stateToMarkdown(previewState)}\n`, 'utf8');
    console.log(`Run preview written: ${previewPath}`);
    return;
  }

  const state = await loadState(args.stateFile, args.base);
  state.generatedAt = new Date().toISOString();
  state.baseBranch = args.base;

  for (const item of normalized) {
    const key = String(item.number);
    const previous = state.issues[key];
    if (previous?.status === 'done') {
      continue;
    }
    if ((previous?.retries || 0) >= args.maxRetries && previous?.status === 'failed') {
      continue;
    }

    state.issues[key] = {
      number: item.number,
      status: 'running',
      retries: previous?.retries || 0,
      updatedAt: new Date().toISOString(),
      agent: item.agent,
      branch: item.branch,
      worktree: item.worktree,
    };
    await saveState(args.stateFile, state);

    if (args.createWorktrees) {
      ensureWorktree(item, args.base, args.worktreeRoot);
    }
    if (args.comment) {
      postAssignmentComment(item);
    }

    if (args.workerCommand) {
      const command = replaceTemplate(args.workerCommand, item);
      const run = runCommand(command, process.cwd());
      if (!run.ok) {
        state.issues[key] = {
          ...state.issues[key],
          status: 'failed',
          retries: (state.issues[key].retries || 0) + 1,
          updatedAt: new Date().toISOString(),
          lastError: 'worker command failed',
        };
        await saveState(args.stateFile, state);
        continue;
      }
    } else {
      state.issues[key] = {
        ...state.issues[key],
        status: 'dispatched',
        updatedAt: new Date().toISOString(),
      };
      await saveState(args.stateFile, state);
    }

    if (args.strictGate) {
      const gate = runGate(item, args);
      if (!gate.ok) {
        state.issues[key] = {
          ...state.issues[key],
          status: 'failed',
          retries: (state.issues[key].retries || 0) + 1,
          updatedAt: new Date().toISOString(),
          gateFailures: gate.failures,
          lastError: gate.failures.join('; '),
        };
        await saveState(args.stateFile, state);
        continue;
      }
    }

    state.issues[key] = {
      ...state.issues[key],
      status: 'done',
      updatedAt: new Date().toISOString(),
      lastError: undefined,
      gateFailures: undefined,
    };
    await saveState(args.stateFile, state);
  }

  const runSummaryPath = args.output || 'docs/ops/orchestrator-run-state.md';
  await fs.mkdir(path.dirname(runSummaryPath), { recursive: true });
  await fs.writeFile(runSummaryPath, `${stateToMarkdown(state)}\n`, 'utf8');

  console.log(`Execution complete. Current branch: ${currentBranch}`);
  console.log(`State written: ${args.stateFile}`);
  console.log(`Run summary: ${runSummaryPath}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
