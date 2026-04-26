#!/usr/bin/env node

import fs from 'node:fs/promises';

const githubToken = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!githubToken) {
  throw new Error('GITHUB_TOKEN is required');
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
const totalAdditions = changedFiles.reduce((sum, file) => sum + (file.additions || 0), 0);
const totalDeletions = changedFiles.reduce((sum, file) => sum + (file.deletions || 0), 0);
const totalChanges = totalAdditions + totalDeletions;

const findings = [];
const seen = new Set();

const addFinding = (severity, title, body, file) => {
  const key = [severity, title, body, file].join('::');
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  findings.push({ severity, title, body, file });
};

const areaSet = new Set();
const hasTestChanges = changedFiles.some((file) => file.filename.startsWith('backend/src/test/'));

for (const file of changedFiles) {
  const filename = file.filename;
  const root = filename.split('/')[0];
  areaSet.add(root);

  const patch = typeof file.patch === 'string' ? file.patch : '';
  const addedLines = patch
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1).trim())
    .filter(Boolean);

  for (const line of addedLines) {
    if (/\b(eval|new Function)\s*\(/.test(line)) {
      addFinding(
        'high',
        '동적 코드 실행 패턴 확인 필요',
        '추가된 코드에 동적 실행 패턴이 보입니다. 금융/보안 프로젝트에서는 이 패턴을 피하거나 엄격하게 제한하는 편이 안전합니다.',
        filename
      );
    }

    if (/console\.log\s*\(/.test(line)) {
      addFinding(
        'low',
        '디버그 출력 제거 권장',
        '배포 코드에 디버그 출력이 남아 있습니다. 개발 중 임시 로그라면 제거하거나 로깅 전략으로 대체하세요.',
        filename
      );
    }

    if (/\bTODO\b|\bFIXME\b|\bHACK\b|\bXXX\b/.test(line)) {
      addFinding(
        'medium',
        '임시 주석이 남아 있음',
        '추가된 코드에 임시 표시가 남아 있습니다. PR 단계에서는 실제 동작 또는 명확한 후속 이슈 링크로 정리하는 편이 좋습니다.',
        filename
      );
    }

    if (/debugger;/.test(line)) {
      addFinding(
        'medium',
        '디버거 문장이 남아 있음',
        '디버그용 debugger 문장이 포함되어 있습니다. 커밋 전에 제거하는 것이 안전합니다.',
        filename
      );
    }
  }
}

const codeAreas = Array.from(areaSet).filter((area) => area !== 'docs' && area !== '.github');
if (codeAreas.length > 1) {
  addFinding(
    'medium',
    '여러 구현 영역이 한 PR에 섞여 있음',
    `이번 PR은 ${codeAreas.join(', ')} 영역을 함께 변경하고 있습니다. 기능 단위를 더 쪼개면 검토와 머지가 쉬워집니다.`,
    changedFiles[0]?.filename || repository
  );
}

if (changedFiles.length >= 8 || totalChanges >= 600) {
  addFinding(
    'medium',
    'PR 규모가 큰 편임',
    '변경량이 꽤 큽니다. 가능하면 추후에는 데이터, API, UI, 보안 변경을 더 잘게 나눠 제출하는 편이 좋습니다.',
    changedFiles[0]?.filename || repository
  );
}

if (changedFiles.some((file) => file.filename.startsWith('backend/src/main/java')) && !hasTestChanges) {
  addFinding(
    'medium',
    '백엔드 변경에 테스트가 보이지 않음',
    'backend/src/main/java 변경이 있으나 backend/src/test/ 변경이 보이지 않습니다. 최소한의 단위 테스트 추가 여부를 검토하세요.',
    changedFiles.find((file) => file.filename.startsWith('backend/src/main/java'))?.filename || repository
  );
}

const summaryParts = [
  `변경 파일 ${changedFiles.length}개`,
  `추가 ${totalAdditions}줄`,
  `삭제 ${totalDeletions}줄`,
];

const reviewLines = [
  marker,
  '## 무료 규칙 리뷰 요약',
  `${summaryParts.join(' · ')}`,
  '',
  findings.length === 0
    ? '중대한 문제는 발견하지 못했습니다. 다만 기능이 커질수록 데이터/백엔드/프론트 책임을 더 잘 분리하는 편이 좋습니다.'
    : '자동 규칙으로 아래 항목들을 확인했습니다.',
];

if (findings.length > 0) {
  reviewLines.push('', '## 발견 사항');
  for (const finding of findings) {
    reviewLines.push(`- [${finding.severity}] ${finding.title} \`${finding.file}\``);
    reviewLines.push(`  - ${finding.body}`);
  }
} else {
  reviewLines.push('', '## 발견 사항', '- 자동 규칙 기준에서 큰 문제는 보이지 않았습니다.');
}

const reviewBody = reviewLines.join('\n');
const reviewEvent = findings.some((finding) => finding.severity === 'high') ? 'REQUEST_CHANGES' : 'COMMENT';

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
