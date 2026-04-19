#!/usr/bin/env node

import fs from 'node:fs/promises';

const githubToken = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-5.1';

if (!githubToken) {
  throw new Error('GITHUB_TOKEN is required');
}

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

if (!repository) {
  throw new Error('GITHUB_REPOSITORY is required');
}

if (!eventPath) {
  throw new Error('GITHUB_EVENT_PATH is required');
}

const event = JSON.parse(await fs.readFile(eventPath, 'utf8'));
const pullRequest = event.pull_request;

if (!pullRequest?.number) {
  throw new Error('This workflow only supports pull request events');
}

const [owner, repo] = repository.split('/');
if (!owner || !repo) {
  throw new Error(`Invalid repository value: ${repository}`);
}

const marker = '<!-- ai-pr-review-bot -->';
const headSha = pullRequest.head?.sha;
const pullNumber = pullRequest.number;

if (pullRequest.head?.repo?.full_name !== repository) {
  console.log('Skipping forked pull request.');
  process.exit(0);
}

const ghRequest = async (path, init = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'costwise-ai-pr-review-bot',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status} ${response.statusText}) for ${path}`);
  }

  return response;
};

const listAll = async (path) => {
  const items = [];
  let page = 1;

  while (true) {
    const response = await ghRequest(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    items.push(...batch);
    if (batch.length < 100) {
      break;
    }
    page += 1;
  }

  return items;
};

const existingReviews = await listAll(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`);
const alreadyReviewed = existingReviews.some((review) => {
  return review?.user?.login === 'github-actions[bot]'
    && review?.commit_id === headSha
    && typeof review?.body === 'string'
    && review.body.includes(marker);
});

if (alreadyReviewed) {
  console.log('Skipping because this commit already has a bot review.');
  process.exit(0);
}

const changedFiles = await listAll(`/repos/${owner}/${repo}/pulls/${pullNumber}/files`);
const repoFilesToRead = [
  'AGENTS.md',
  'docs/ops/README.md',
  'docs/ops/pr-ai-review.md',
  'docs/ai-collaboration.md',
  'docs/worktree-strategy.md',
  'docs/dev-logs/README.md',
  'docs/git/branch-naming.md',
];

const readTextFile = async (relativePath) => {
  try {
    return await fs.readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  } catch {
    return null;
  }
};

const repositoryRules = {};
for (const relativePath of repoFilesToRead) {
  const content = await readTextFile(relativePath);
  if (content) {
    repositoryRules[relativePath] = content;
  }
}

const trimmedFiles = changedFiles.map((file) => {
  const patch = typeof file.patch === 'string' ? file.patch.slice(0, 4000) : '';
  return {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    patch: patch || '[patch omitted]',
  };
});

const reviewSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          title: { type: 'string' },
          body: { type: 'string' },
          file: { type: 'string' },
          line: { type: ['integer', 'null'] },
        },
        required: ['severity', 'title', 'body', 'file', 'line'],
      },
    },
  },
  required: ['summary', 'findings'],
};

const prompt = [
  {
    role: 'system',
    content: [
      {
        type: 'input_text',
        text: [
          'You are a rigorous pull request reviewer for this repository.',
          'Focus on concrete, actionable issues only.',
          'Use the repository rules and the diff context to evaluate correctness, maintainability, and safety.',
          'Return only structured JSON that matches the provided schema.',
        ].join(' '),
      },
    ],
  },
  {
    role: 'user',
    content: [
      {
        type: 'input_text',
        text: JSON.stringify(
          {
            repository,
            pullRequest: {
              number: pullNumber,
              title: pullRequest.title,
              body: pullRequest.body,
              draft: pullRequest.draft,
              base: pullRequest.base?.ref,
              head: pullRequest.head?.ref,
              headSha,
            },
            repositoryRules,
            changedFiles: trimmedFiles,
          },
          null,
          2,
        ),
      },
    ],
  },
];

const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: openaiModel,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'pr_review',
        strict: true,
        schema: reviewSchema,
      },
    },
    temperature: 0.2,
    max_output_tokens: 2000,
  }),
});

if (!openaiResponse.ok) {
  const errorText = await openaiResponse.text();
  throw new Error(`OpenAI request failed (${openaiResponse.status} ${openaiResponse.statusText}): ${errorText}`);
}

const responseJson = await openaiResponse.json();

const extractText = (response) => {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  return null;
};

const outputText = extractText(responseJson);
if (!outputText) {
  throw new Error('OpenAI response did not include output text');
}

let parsed;
try {
  parsed = JSON.parse(outputText);
} catch (error) {
  throw new Error(`Failed to parse OpenAI JSON output: ${error.message}\nRaw output: ${outputText}`);
}

const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
const hasBlockingIssue = findings.some((finding) => finding.severity === 'high');

const reviewLines = [
  marker,
  '## AI 검토 요약',
  summary || '검토 요약을 생성하지 못했습니다.',
];

if (findings.length > 0) {
  reviewLines.push('', '## 발견 사항');
  for (const finding of findings) {
    const location = finding.file ? ` \`${finding.file}\`${finding.line ? `:${finding.line}` : ''}` : '';
    reviewLines.push(`- [${finding.severity}] ${finding.title}${location}`);
    reviewLines.push(`  - ${finding.body}`);
  }
} else {
  reviewLines.push('', '## 발견 사항', '- 중대한 문제는 발견하지 못했습니다.');
}

const reviewBody = reviewLines.join('\n');
const reviewEvent = hasBlockingIssue ? 'REQUEST_CHANGES' : 'COMMENT';

const submitResponse = await ghRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
  method: 'POST',
  body: JSON.stringify({
    body: reviewBody,
    event: reviewEvent,
  }),
  headers: {
    'Content-Type': 'application/json',
  },
});

const submitted = await submitResponse.json();
console.log(`Submitted PR review ${submitted.id} with event ${reviewEvent}.`);
