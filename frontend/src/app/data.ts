export type Role = '기획자' | '재무팀' | '임원';

export type RiskLevel = '낮음' | '중간' | '높음';

export type ProjectStatus = '검토중' | '조건부 진행' | '보류' | '승인';

export type AbcLine = {
  id: string;
  department: string;
  activity: string;
  driver: string;
  costKrw: number;
};

export type DcfYear = {
  year: number;
  revenueKrw: number;
  operatingCashFlowKrw: number;
  freeCashFlowKrw: number;
};

export type Assumption = {
  id: string;
  label: string;
  value: string;
};

export type AuditEvent = {
  id: string;
  at: string; // ISO 8601
  actor: string;
  action: string;
  domain: 'ABC' | 'DCF' | 'ASSUMPTION' | 'ACCESS';
};

export type DashboardData = {
  roles: Role[];
  project: {
    name: string;
    owner: string;
    status: ProjectStatus;
    risk: RiskLevel;
    budgetKrw: number;
    expectedIrr: number; // 0-1
    npvKrw: number;
    paybackYears: number;
  };
  abc: { lines: AbcLine[] };
  dcf: {
    discountRate: number; // 0-1
    terminalGrowthRate: number; // 0-1
    corporateTaxRate: number; // 0-1
    years: DcfYear[];
  };
  assumptions: Assumption[];
  audit: { events: AuditEvent[] };
};

export type RoleInsight = {
  headline: string;
  summary: string;
  decisionFocus: string;
  riskWatch: string;
  nextAction: string;
};

export const dashboardData: DashboardData = {
  roles: ['기획자', '재무팀', '임원'],
  project: {
    name: '보험사 신규 사업 의사결정 지원 플랫폼',
    status: '검토중',
    owner: '전략기획실',
    budgetKrw: 120_000_000,
    expectedIrr: 0.168,
    npvKrw: 340_000_000,
    paybackYears: 3.1,
    risk: '중간'
  },
  abc: {
    lines: [
      {
        id: 'abc-digital-channel-plan',
        department: '디지털채널팀',
        activity: '신규 서비스 기획',
        driver: '기획 인시',
        costKrw: 28_000_000
      },
      {
        id: 'abc-product-policy',
        department: '상품개발팀',
        activity: '상품/정책 설계',
        driver: '정책 변경 건수',
        costKrw: 36_000_000
      },
      {
        id: 'abc-data-platform-integration',
        department: '데이터플랫폼팀',
        activity: '연계/검증',
        driver: '인터페이스 호출량',
        costKrw: 24_000_000
      },
      {
        id: 'abc-security-access-audit',
        department: '보안운영팀',
        activity: '권한/감사 관리',
        driver: '승인 이벤트 수',
        costKrw: 16_000_000
      }
    ]
  },
  dcf: {
    discountRate: 0.115,
    corporateTaxRate: 0.275,
    terminalGrowthRate: 0.02,
    years: [
      {
        year: 1,
        revenueKrw: 38_000_000,
        operatingCashFlowKrw: 14_000_000,
        freeCashFlowKrw: 9_000_000
      },
      {
        year: 2,
        revenueKrw: 64_000_000,
        operatingCashFlowKrw: 24_000_000,
        freeCashFlowKrw: 18_000_000
      },
      {
        year: 3,
        revenueKrw: 91_000_000,
        operatingCashFlowKrw: 36_000_000,
        freeCashFlowKrw: 28_000_000
      },
      {
        year: 4,
        revenueKrw: 113_000_000,
        operatingCashFlowKrw: 43_000_000,
        freeCashFlowKrw: 33_000_000
      },
      {
        year: 5,
        revenueKrw: 129_000_000,
        operatingCashFlowKrw: 49_000_000,
        freeCashFlowKrw: 37_000_000
      }
    ]
  },
  assumptions: [
    { id: 'as-discount', label: '할인율', value: '11.5%' },
    { id: 'as-tax', label: '법인세율', value: '27.5%' },
    { id: 'as-terminal-growth', label: '잔존가치 성장률', value: '2.0%' },
    { id: 'as-abc-scope', label: '총 배부 기준', value: 'ABC 활동 4개' }
  ],
  audit: {
    events: [
      {
        id: 'au-2026-04-18-seed',
        at: '2026-04-18T10:18:00+09:00',
        actor: '전략기획실',
        action: '신규 사업 초안을 등록했습니다.',
        domain: 'ACCESS'
      },
      {
        id: 'au-2026-04-19-abc-review',
        at: '2026-04-19T14:07:00+09:00',
        actor: '재무팀',
        action: 'ABC 배부 기준을 검토했습니다.',
        domain: 'ABC'
      },
      {
        id: 'au-2026-04-19-access-policy',
        at: '2026-04-19T16:42:00+09:00',
        actor: '보안운영팀',
        action: '권한 및 감사 로그 정책을 승인했습니다.',
        domain: 'ACCESS'
      },
      {
        id: 'au-2026-04-20-dcf-stage',
        at: '2026-04-20T09:12:00+09:00',
        actor: '임원',
        action: 'DCF 시나리오 1안을 검토 대기 상태로 전환했습니다.',
        domain: 'DCF'
      }
    ]
  }
};

export const roleInsights: Record<Role, RoleInsight> = {
  기획자: {
    headline: '사업 가설과 투자 범위를 정리합니다.',
    summary:
      '신규 사업이 어떤 고객 문제를 풀고, 어떤 부서 자원을 쓰며, 어떤 가정을 전제로 성립하는지 확인합니다.',
    decisionFocus: '사업 범위, 실행 시점, 기능 우선순위',
    riskWatch: '가정값이 빠진 상태로 승인을 요청하면 DCF 결과가 과대평가될 수 있습니다.',
    nextAction: '가정값 수정 후 재계산 요청'
  },
  재무팀: {
    headline: 'ABC 원가배분의 근거를 점검합니다.',
    summary:
      '부서별 원가가 활동 기준과 연결되는지, 배부 규칙이 설명 가능한지, 누락된 비용 풀이 없는지 확인합니다.',
    decisionFocus: '원가동인, 배부 기준, 재계산 이력',
    riskWatch: '배부 기준이 과도하게 단순하면 비용 왜곡이 발생할 수 있습니다.',
    nextAction: '배부 규칙 검토 후 확정 의견 작성'
  },
  임원: {
    headline: 'NPV와 회수기간으로 승인 여부를 판단합니다.',
    summary:
      '투자 타당성, 회수 가능성, 리스크 수준을 한 화면에서 보고 조건부 진행 여부를 빠르게 판단합니다.',
    decisionFocus: 'NPV, IRR, 회수기간, 리스크 신호',
    riskWatch: '감사 로그가 부족하면 승인 근거가 추적되지 않을 수 있습니다.',
    nextAction: '조건부 승인 또는 보류 의사결정'
  }
};

export const decisionSignals = [
  { label: '검토 단계', value: '임원 최종 확인' },
  { label: '감사 수준', value: '변경 이력 추적' },
  { label: '리스크 신호', value: '중간' },
  { label: '다음 이벤트', value: '가정값 재조정' }
] as const;
