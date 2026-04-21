export type Role = '원가담당자' | '재무검토자' | '본부장' | '임원';

export type RiskLevel = '낮음' | '중간' | '높음';

export type ProjectStatus = '검토중' | '조건부 진행' | '보류' | '승인';

export type AssetCategory = '주식' | '채권' | '파생상품' | '프로젝트';

export type HeadquartersSummary = {
  code: string;
  name: string;
  projectCount: number;
  totalInvestmentKrw: number;
  totalExpectedRevenueKrw: number;
  averageNpvKrw: number;
  risk: RiskLevel;
  priorityProject: string;
};

export type ProjectSummary = {
  rank: number;
  code: string;
  name: string;
  headquarter: string;
  investmentKrw: number;
  expectedRevenueKrw: number;
  npvKrw: number;
  irr: number;
  paybackYears: number;
  status: ProjectStatus;
  risk: RiskLevel;
  assetCategory: AssetCategory;
};

export type ProjectDetail = {
  code: string;
  manager: string;
  startDate: string;
  lifecycle: string;
  assetCategory: AssetCategory;
  headline: string;
  allocation: {
    personnelCostKrw: number;
    projectCostKrw: number;
    headquarterCostKrw: number;
    enterpriseCostKrw: number;
    internalTransferPriceKrw: number;
    standardCostKrw: number;
    allocatedCostKrw: number;
    efficiencyGapKrw: number;
    performanceGapKrw: number;
  };
  valuation: {
    fairValueKrw: number;
    var95Krw: number;
    var99Krw: number;
    cvar95Krw: number;
    duration: number;
    convexity: number;
    creditRiskScore: number;
    creditGrade: string;
  };
  scenarioReturns: Array<{
    label: '낙관' | '기준' | '비관';
    npvKrw: number;
    probability: number;
  }>;
  workflow: {
    currentStage: '기획' | '검토' | '승인' | '보류';
    owner: string;
    financeReviewer: string;
    executiveComment: string;
    nextStep: string;
  };
};

export type Assumption = {
  label: string;
  value: string;
};

export type AuditEvent = {
  at: string;
  actor: string;
  action: string;
  domain: 'PORTFOLIO' | 'ABC' | 'DCF' | 'ACCESS';
};

export type PortfolioSummary = {
  portfolioName: string;
  owner: string;
  status: ProjectStatus;
  risk: RiskLevel;
  overview: {
    headquarterCount: number;
    projectCount: number;
    totalInvestmentKrw: number;
    totalExpectedRevenueKrw: number;
    averageNpvKrw: number;
    averageIrr: number;
    averagePaybackYears: number;
    approvedCount: number;
    conditionalCount: number;
  };
  headquarters: HeadquartersSummary[];
  projects: ProjectSummary[];
  assumptions: Assumption[];
  auditEvents: AuditEvent[];
};

export type RoleInsight = {
  headline: string;
  summary: string;
  decisionFocus: string;
  riskWatch: string;
  nextAction: string;
};

type ProjectSeed = {
  code: string;
  name: string;
  headquarter: string;
  investmentKrw: number;
  expectedRevenueKrw: number;
  npvKrw: number;
  irr: number;
  paybackYears: number;
  status: ProjectStatus;
  risk: RiskLevel;
  assetCategory: AssetCategory;
};

const projectSeeds: ProjectSeed[] = [
  {
    code: 'UND-01',
    name: '암보험 신상품 출시',
    headquarter: '언더라이팅본부',
    investmentKrw: 6_500_000_000,
    expectedRevenueKrw: 11_200_000_000,
    npvKrw: 2_100_000_000,
    irr: 0.182,
    paybackYears: 2.8,
    status: '승인',
    risk: '중간',
    assetCategory: '프로젝트'
  },
  {
    code: 'UND-02',
    name: '인수심사 자동화',
    headquarter: '언더라이팅본부',
    investmentKrw: 4_200_000_000,
    expectedRevenueKrw: 8_100_000_000,
    npvKrw: 1_700_000_000,
    irr: 0.171,
    paybackYears: 3.1,
    status: '조건부 진행',
    risk: '낮음',
    assetCategory: '파생상품'
  },
  {
    code: 'UND-03',
    name: '위험요율 재설계',
    headquarter: '언더라이팅본부',
    investmentKrw: 3_100_000_000,
    expectedRevenueKrw: 5_900_000_000,
    npvKrw: 900_000_000,
    irr: 0.129,
    paybackYears: 3.8,
    status: '검토중',
    risk: '중간',
    assetCategory: '채권'
  },
  {
    code: 'UND-04',
    name: '사전심사 대시보드',
    headquarter: '언더라이팅본부',
    investmentKrw: 2_800_000_000,
    expectedRevenueKrw: 4_700_000_000,
    npvKrw: -400_000_000,
    irr: 0.094,
    paybackYears: 4.6,
    status: '보류',
    risk: '높음',
    assetCategory: '주식'
  },
  {
    code: 'PROD-01',
    name: '디지털 건강보험',
    headquarter: '상품개발본부',
    investmentKrw: 5_400_000_000,
    expectedRevenueKrw: 9_800_000_000,
    npvKrw: 2_400_000_000,
    irr: 0.194,
    paybackYears: 2.5,
    status: '승인',
    risk: '중간',
    assetCategory: '프로젝트'
  },
  {
    code: 'PROD-02',
    name: '가족보험 패키지',
    headquarter: '상품개발본부',
    investmentKrw: 4_600_000_000,
    expectedRevenueKrw: 8_300_000_000,
    npvKrw: 1_500_000_000,
    irr: 0.161,
    paybackYears: 3.0,
    status: '조건부 진행',
    risk: '낮음',
    assetCategory: '주식'
  },
  {
    code: 'PROD-03',
    name: '특약 정비',
    headquarter: '상품개발본부',
    investmentKrw: 3_000_000_000,
    expectedRevenueKrw: 4_900_000_000,
    npvKrw: 300_000_000,
    irr: 0.112,
    paybackYears: 4.2,
    status: '검토중',
    risk: '중간',
    assetCategory: '채권'
  },
  {
    code: 'PROD-04',
    name: '상품약관 자동화',
    headquarter: '상품개발본부',
    investmentKrw: 2_500_000_000,
    expectedRevenueKrw: 4_100_000_000,
    npvKrw: -700_000_000,
    irr: 0.089,
    paybackYears: 4.8,
    status: '보류',
    risk: '높음',
    assetCategory: '파생상품'
  },
  {
    code: 'SALES-01',
    name: 'GA 영업지원 포털',
    headquarter: '영업본부',
    investmentKrw: 4_900_000_000,
    expectedRevenueKrw: 9_500_000_000,
    npvKrw: 1_900_000_000,
    irr: 0.168,
    paybackYears: 2.9,
    status: '승인',
    risk: '중간',
    assetCategory: '프로젝트'
  },
  {
    code: 'SALES-02',
    name: '설계사 리드분배',
    headquarter: '영업본부',
    investmentKrw: 3_800_000_000,
    expectedRevenueKrw: 7_200_000_000,
    npvKrw: 1_100_000_000,
    irr: 0.143,
    paybackYears: 3.4,
    status: '조건부 진행',
    risk: '낮음',
    assetCategory: '주식'
  },
  {
    code: 'SALES-03',
    name: '모바일 견적 고도화',
    headquarter: '영업본부',
    investmentKrw: 3_100_000_000,
    expectedRevenueKrw: 5_600_000_000,
    npvKrw: 200_000_000,
    irr: 0.108,
    paybackYears: 4.1,
    status: '검토중',
    risk: '중간',
    assetCategory: '채권'
  },
  {
    code: 'SALES-04',
    name: '채널 수익성 분석',
    headquarter: '영업본부',
    investmentKrw: 2_700_000_000,
    expectedRevenueKrw: 4_300_000_000,
    npvKrw: -900_000_000,
    irr: 0.081,
    paybackYears: 5.0,
    status: '보류',
    risk: '높음',
    assetCategory: '파생상품'
  },
  {
    code: 'IT-01',
    name: '디지털 플랫폼 구축',
    headquarter: 'IT본부',
    investmentKrw: 7_800_000_000,
    expectedRevenueKrw: 13_600_000_000,
    npvKrw: 3_500_000_000,
    irr: 0.207,
    paybackYears: 2.3,
    status: '승인',
    risk: '중간',
    assetCategory: '프로젝트'
  },
  {
    code: 'IT-02',
    name: '마이데이터 연계',
    headquarter: 'IT본부',
    investmentKrw: 5_900_000_000,
    expectedRevenueKrw: 10_700_000_000,
    npvKrw: 2_000_000_000,
    irr: 0.176,
    paybackYears: 2.8,
    status: '조건부 진행',
    risk: '낮음',
    assetCategory: '주식'
  },
  {
    code: 'IT-03',
    name: '데이터허브 확장',
    headquarter: 'IT본부',
    investmentKrw: 4_300_000_000,
    expectedRevenueKrw: 7_400_000_000,
    npvKrw: 800_000_000,
    irr: 0.131,
    paybackYears: 3.7,
    status: '검토중',
    risk: '중간',
    assetCategory: '채권'
  },
  {
    code: 'IT-04',
    name: '콜센터 고도화',
    headquarter: 'IT본부',
    investmentKrw: 3_900_000_000,
    expectedRevenueKrw: 6_200_000_000,
    npvKrw: -1_100_000_000,
    irr: 0.079,
    paybackYears: 5.2,
    status: '보류',
    risk: '높음',
    assetCategory: '파생상품'
  },
  {
    code: 'CORP-01',
    name: '원가배분 체계개편',
    headquarter: '경영지원본부',
    investmentKrw: 2_900_000_000,
    expectedRevenueKrw: 5_300_000_000,
    npvKrw: 600_000_000,
    irr: 0.122,
    paybackYears: 3.9,
    status: '검토중',
    risk: '낮음',
    assetCategory: '프로젝트'
  },
  {
    code: 'CORP-02',
    name: '감사로그 표준화',
    headquarter: '경영지원본부',
    investmentKrw: 2_400_000_000,
    expectedRevenueKrw: 4_500_000_000,
    npvKrw: 400_000_000,
    irr: 0.117,
    paybackYears: 4.0,
    status: '조건부 진행',
    risk: '낮음',
    assetCategory: '채권'
  },
  {
    code: 'CORP-03',
    name: '성과관리 대시보드',
    headquarter: '경영지원본부',
    investmentKrw: 3_200_000_000,
    expectedRevenueKrw: 5_100_000_000,
    npvKrw: -300_000_000,
    irr: 0.097,
    paybackYears: 4.4,
    status: '검토중',
    risk: '중간',
    assetCategory: '주식'
  },
  {
    code: 'CORP-04',
    name: '권한통제 재설계',
    headquarter: '경영지원본부',
    investmentKrw: 2_100_000_000,
    expectedRevenueKrw: 3_700_000_000,
    npvKrw: -1_200_000_000,
    irr: 0.074,
    paybackYears: 5.6,
    status: '보류',
    risk: '높음',
    assetCategory: '파생상품'
  }
];

export const navigationItems = [
  { key: 'dashboard', label: '포트폴리오 대시보드' },
  { key: 'projects', label: '프로젝트 목록' },
  { key: 'audit', label: '감사 로그' }
] as const;

export const detailTabs = [
  { key: 'allocation', label: '원가 관리 회계' },
  { key: 'valuation', label: '금융 평가' },
  { key: 'risk', label: 'VaR 리스크' },
  { key: 'workflow', label: '승인 워크플로우' }
] as const;

export const headquarterPalette: Record<string, string> = {
  언더라이팅본부: 'hq-chip--blue',
  상품개발본부: 'hq-chip--green',
  영업본부: 'hq-chip--amber',
  IT본부: 'hq-chip--violet',
  경영지원본부: 'hq-chip--rose'
};

export const defaultPortfolioSummary: PortfolioSummary =
  buildPortfolioSummary();

export const roleInsights: Record<Role, RoleInsight> = {
  원가담당자: {
    headline: '5개 본부의 원가가 활동 기준에 맞게 배분되는지 확인합니다.',
    summary:
      '본부별 배부 기준, 비용풀, 활동량이 서로 맞물리는지 보고 원가 왜곡이 없는지 점검합니다.',
    decisionFocus: '배부 기준, 본부별 원가, 비용풀 누락',
    riskWatch: '배부 기준이 단순하면 본부별 비교가 왜곡될 수 있습니다.',
    nextAction: '배부 기준 조정 후 재배분 요청'
  },
  재무검토자: {
    headline: 'DCF와 시나리오를 보고 투자 타당성을 점검합니다.',
    summary:
      'NPV, IRR, 회수기간을 검토하고 낙관/기준/비관 시나리오 차이가 허용 가능한지 확인합니다.',
    decisionFocus: '현금흐름 가정, 할인율, 회수기간',
    riskWatch: '가정값이 흔들리면 순현재가치가 급격히 바뀔 수 있습니다.',
    nextAction: '시나리오별 재평가 요청'
  },
  본부장: {
    headline: '자기 본부의 프로젝트 우선순위를 빠르게 봅니다.',
    summary:
      '본부별 프로젝트 수, 투자 규모, 평균 NPV를 비교하고 본부 내에서 어떤 사업을 먼저 추진할지 판단합니다.',
    decisionFocus: '본부 포트폴리오, 우선순위, 리스크',
    riskWatch: '본부 단위로 보지 않으면 투자 우선순위가 흐려질 수 있습니다.',
    nextAction: '본부별 우선순위 코멘트 작성'
  },
  임원: {
    headline: '전체 포트폴리오를 보고 최종 승인 방향을 정합니다.',
    summary:
      '5개 본부 20개 프로젝트를 한눈에 보고 승인, 조건부 진행, 보류를 빠르게 구분합니다.',
    decisionFocus: '총 투자액, 평균 NPV, 승인 대기 프로젝트',
    riskWatch: '감사 로그가 부족하면 승인 근거가 남지 않을 수 있습니다.',
    nextAction: '최종 승인 또는 보류 의사결정'
  }
};

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8080';

export async function loadPortfolioSummary(): Promise<{
  summary: PortfolioSummary;
  source: 'api' | 'local';
}> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/portfolio/summary`);
    if (!response.ok) {
      throw new Error(`Portfolio summary request failed: ${response.status}`);
    }

    return {
      summary: (await response.json()) as PortfolioSummary,
      source: 'api'
    };
  } catch {
    return {
      summary: defaultPortfolioSummary,
      source: 'local'
    };
  }
}

export function buildDecisionSignals(summary: PortfolioSummary) {
  return [
    { label: '검토 단계', value: summary.status },
    { label: '본부 수', value: `${summary.overview.headquarterCount}개` },
    { label: '프로젝트 수', value: `${summary.overview.projectCount}개` },
    { label: '승인 대기', value: `${summary.overview.conditionalCount}개` }
  ] as const;
}

function buildPortfolioSummary(): PortfolioSummary {
  const headquarters = buildHeadquartersSummary();
  const sortedProjects = [...projectSeeds].sort(
    (left, right) => right.npvKrw - left.npvKrw
  );
  const projects = sortedProjects.map((seed, index) => ({
    rank: index + 1,
    code: seed.code,
    name: seed.name,
    headquarter: seed.headquarter,
    investmentKrw: seed.investmentKrw,
    expectedRevenueKrw: seed.expectedRevenueKrw,
    npvKrw: seed.npvKrw,
    irr: seed.irr,
    paybackYears: seed.paybackYears,
    status: seed.status,
    risk: seed.risk,
    assetCategory: seed.assetCategory
  }));

  const totalInvestmentKrw = projectSeeds.reduce(
    (sum, project) => sum + project.investmentKrw,
    0
  );
  const totalExpectedRevenueKrw = projectSeeds.reduce(
    (sum, project) => sum + project.expectedRevenueKrw,
    0
  );
  const averageNpvKrw = Math.round(
    projectSeeds.reduce((sum, project) => sum + project.npvKrw, 0) /
      projectSeeds.length
  );
  const averageIrr =
    projectSeeds.reduce((sum, project) => sum + project.irr, 0) /
    projectSeeds.length;
  const averagePaybackYears =
    projectSeeds.reduce((sum, project) => sum + project.paybackYears, 0) /
    projectSeeds.length;
  const approvedCount = projectSeeds.filter(
    (project) => project.status === '승인'
  ).length;
  const conditionalCount = projectSeeds.filter(
    (project) => project.status === '조건부 진행'
  ).length;

  return {
    portfolioName: '보험사/금융사 전사 포트폴리오 의사결정 플랫폼',
    owner: '전략기획실',
    status: '검토중',
    risk: '중간',
    overview: {
      headquarterCount: 5,
      projectCount: projectSeeds.length,
      totalInvestmentKrw,
      totalExpectedRevenueKrw,
      averageNpvKrw,
      averageIrr,
      averagePaybackYears,
      approvedCount,
      conditionalCount
    },
    headquarters,
    projects,
    assumptions: [
      { label: '할인율', value: '11.5%' },
      { label: '법인세율', value: '27.5%' },
      { label: '평가기간', value: '5개년' },
      { label: 'ABC 적용 본부', value: '5개' }
    ],
    auditEvents: [
      {
        at: '2026-04-18T10:18:00+09:00',
        actor: '전략기획실',
        action: '포트폴리오 초안을 등록했습니다.',
        domain: 'PORTFOLIO'
      },
      {
        at: '2026-04-19T14:07:00+09:00',
        actor: '재무검토팀',
        action: 'ABC 배부 기준을 검토했습니다.',
        domain: 'ABC'
      },
      {
        at: '2026-04-20T09:12:00+09:00',
        actor: '임원',
        action: '상위 5개 프로젝트를 조건부 진행으로 전환했습니다.',
        domain: 'DCF'
      },
      {
        at: '2026-04-20T11:42:00+09:00',
        actor: '보안운영팀',
        action: '권한 및 감사 로그 정책을 승인했습니다.',
        domain: 'ACCESS'
      }
    ]
  };
}

export function buildProjectDetail(projectCode: string): ProjectDetail {
  const seedIndex = projectSeeds.findIndex(
    (project) => project.code === projectCode
  );
  const seed =
    projectSeeds.find((project) => project.code === projectCode) ??
    projectSeeds[0];
  const managerByHeadquarter: Record<string, string> = {
    언더라이팅본부: '박하늘 PM',
    상품개발본부: '이수민 PM',
    영업본부: '정지훈 PM',
    IT본부: '김가온 PM',
    경영지원본부: '한소윤 PM'
  };
  const investmentBase = seed.investmentKrw;
  const personnelCostKrw = Math.round(investmentBase * 0.32);
  const projectCostKrw = Math.round(investmentBase * 0.41);
  const headquarterCostKrw = Math.round(investmentBase * 0.18);
  const enterpriseCostKrw = Math.round(investmentBase * 0.09);
  const internalTransferPriceKrw = Math.round(projectCostKrw * 0.14);
  const standardCostKrw = Math.round(investmentBase * 0.74);
  const allocatedCostKrw =
    personnelCostKrw +
    projectCostKrw +
    headquarterCostKrw +
    enterpriseCostKrw +
    internalTransferPriceKrw;
  const efficiencyGapKrw = allocatedCostKrw - standardCostKrw;
  const performanceGapKrw = seed.expectedRevenueKrw - allocatedCostKrw;
  const volatility = Math.abs(seed.npvKrw) * 0.27 + investmentBase * 0.05;
  const var95Krw = Math.round(seed.npvKrw - volatility * 1.65);
  const var99Krw = Math.round(seed.npvKrw - volatility * 2.33);
  const cvar95Krw = Math.round(seed.npvKrw - volatility * 2.06);
  const duration = Number((1.8 + seed.paybackYears * 0.46).toFixed(2));
  const convexity = Number(
    (duration * 1.38 + (seed.risk === '높음' ? 1.7 : 0.8)).toFixed(2)
  );
  const creditRiskScore = Math.max(
    24,
    Math.min(
      93,
      Math.round(
        72 +
          (seed.npvKrw > 0 ? 8 : -12) +
          (seed.risk === '낮음' ? 9 : seed.risk === '중간' ? 0 : -15) +
          seed.irr * 30
      )
    )
  );

  return {
    code: seed.code,
    manager: managerByHeadquarter[seed.headquarter],
    startDate: `2026-0${((seedIndex >= 0 ? seedIndex : 0) % 4) + 1}-0${((seedIndex >= 0 ? seedIndex : 0) % 6) + 2}`,
    lifecycle: `${Math.max(2, Math.round(seed.paybackYears))}년`,
    assetCategory: seed.assetCategory,
    headline: `${seed.headquarter}의 ${seed.assetCategory}형 투자안으로, 원가 배부와 금융 리스크를 함께 보는 프로젝트입니다.`,
    allocation: {
      personnelCostKrw,
      projectCostKrw,
      headquarterCostKrw,
      enterpriseCostKrw,
      internalTransferPriceKrw,
      standardCostKrw,
      allocatedCostKrw,
      efficiencyGapKrw,
      performanceGapKrw
    },
    valuation: {
      fairValueKrw: Math.round(seed.expectedRevenueKrw * 0.82),
      var95Krw,
      var99Krw,
      cvar95Krw,
      duration,
      convexity,
      creditRiskScore,
      creditGrade:
        creditRiskScore >= 85
          ? 'AA'
          : creditRiskScore >= 75
            ? 'A'
            : creditRiskScore >= 65
              ? 'BBB'
              : 'BB'
    },
    scenarioReturns: [
      {
        label: '낙관',
        npvKrw: Math.round(seed.npvKrw * 1.42),
        probability: 0.25
      },
      { label: '기준', npvKrw: seed.npvKrw, probability: 0.5 },
      {
        label: '비관',
        npvKrw: Math.round(seed.npvKrw * 0.58 - investmentBase * 0.07),
        probability: 0.25
      }
    ],
    workflow: {
      currentStage:
        seed.status === '승인'
          ? '승인'
          : seed.status === '보류'
            ? '보류'
            : seed.status === '조건부 진행'
              ? '검토'
              : '기획',
      owner: managerByHeadquarter[seed.headquarter],
      financeReviewer: '재무검토실 김도윤',
      executiveComment:
        seed.risk === '높음'
          ? '현금흐름 방어 시나리오 보완 후 재상정'
          : '기준 시나리오 유지 시 조건부 승인 가능',
      nextStep:
        seed.status === '승인' ? '사후 성과 모니터링' : '승인위원회 안건 등록'
    }
  };
}

function buildHeadquartersSummary(): HeadquartersSummary[] {
  return [
    buildHeadquarter('UND', '언더라이팅본부', '중간'),
    buildHeadquarter('PROD', '상품개발본부', '중간'),
    buildHeadquarter('SALES', '영업본부', '중간'),
    buildHeadquarter('IT', 'IT본부', '높음'),
    buildHeadquarter('CORP', '경영지원본부', '낮음')
  ];
}

function buildHeadquarter(
  code: string,
  name: string,
  risk: RiskLevel
): HeadquartersSummary {
  const projects = projectSeeds.filter((project) =>
    project.code.startsWith(code)
  );
  const projectCount = projects.length;
  const totalInvestmentKrw = projects.reduce(
    (sum, project) => sum + project.investmentKrw,
    0
  );
  const totalExpectedRevenueKrw = projects.reduce(
    (sum, project) => sum + project.expectedRevenueKrw,
    0
  );
  const averageNpvKrw = Math.round(
    projects.reduce((sum, project) => sum + project.npvKrw, 0) / projectCount
  );
  const priorityProject =
    projects.slice().sort((left, right) => right.npvKrw - left.npvKrw)[0]
      ?.name ?? '프로젝트 없음';

  return {
    code,
    name,
    projectCount,
    totalInvestmentKrw,
    totalExpectedRevenueKrw,
    averageNpvKrw,
    risk,
    priorityProject
  };
}
