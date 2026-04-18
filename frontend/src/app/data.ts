export type Role = '기획자' | '재무팀' | '임원';

export type CostLine = {
  department: string;
  activity: string;
  cost: number;
  driver: string;
};

export type CashFlowYear = {
  year: number;
  revenue: number;
  operatingCashFlow: number;
  freeCashFlow: number;
};

export const roles: Role[] = ['기획자', '재무팀', '임원'];

export const projectSummary = {
  name: '보험사 신규 사업 의사결정 지원 플랫폼',
  status: '검토중',
  owner: '전략기획실',
  budget: '₩1.2억',
  expectedIRR: '16.8%',
  npv: '₩3.4억',
  payback: '3.1년',
  risk: '중간'
};

export const costLines: CostLine[] = [
  {
    department: '디지털채널팀',
    activity: '신규 서비스 기획',
    cost: 28000000,
    driver: '기획 인시'
  },
  {
    department: '상품개발팀',
    activity: '상품/정책 설계',
    cost: 36000000,
    driver: '정책 변경 건수'
  },
  {
    department: '데이터플랫폼팀',
    activity: '연계/검증',
    cost: 24000000,
    driver: '인터페이스 호출량'
  },
  {
    department: '보안운영팀',
    activity: '권한/감사 관리',
    cost: 16000000,
    driver: '승인 이벤트 수'
  }
];

export const cashFlows: CashFlowYear[] = [
  {
    year: 1,
    revenue: 38000000,
    operatingCashFlow: 14000000,
    freeCashFlow: 9000000
  },
  {
    year: 2,
    revenue: 64000000,
    operatingCashFlow: 24000000,
    freeCashFlow: 18000000
  },
  {
    year: 3,
    revenue: 91000000,
    operatingCashFlow: 36000000,
    freeCashFlow: 28000000
  },
  {
    year: 4,
    revenue: 113000000,
    operatingCashFlow: 43000000,
    freeCashFlow: 33000000
  },
  {
    year: 5,
    revenue: 129000000,
    operatingCashFlow: 49000000,
    freeCashFlow: 37000000
  }
];

export const assumptions = [
  { label: '할인율', value: '11.5%' },
  { label: '법인세율', value: '27.5%' },
  { label: '잔존가치 성장률', value: '2.0%' },
  { label: '총 배부 기준', value: 'ABC 활동 4개' }
];

export const auditTrail = [
  '전략기획실이 신규 사업 초안을 등록했습니다.',
  '재무팀이 ABC 배부 기준을 검토했습니다.',
  '보안운영팀이 권한 및 감사 로그 정책을 승인했습니다.',
  '임원이 DCF 시나리오 1안을 검토 대기 상태로 전환했습니다.'
];
