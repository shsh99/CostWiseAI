begin;

truncate table
  audit_logs,
  workflow_states,
  users,
  approval_logs,
  valuation_results,
  cash_flows,
  allocation_rules,
  cost_pools,
  scenarios,
  departments,
  projects
restart identity cascade;

create temporary table seed_departments (
  id uuid primary key,
  code text not null,
  name text not null,
  sort_order integer not null
) on commit drop;

insert into seed_departments (id, code, name, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', 'HQ01', '투자운용본부', 1),
  ('10000000-0000-0000-0000-000000000002', 'HQ02', '리스크관리본부', 2),
  ('10000000-0000-0000-0000-000000000003', 'HQ03', '재무회계본부', 3),
  ('10000000-0000-0000-0000-000000000004', 'HQ04', '금융공학본부', 4),
  ('10000000-0000-0000-0000-000000000005', 'HQ05', 'IT전략본부', 5);

insert into departments (id, code, name, sort_order)
select id, code, name, sort_order
from seed_departments
order by sort_order;

create temporary table seed_projects (
  id uuid primary key,
  code text not null,
  name text not null,
  department_code text not null,
  business_type text not null,
  workflow_status text not null,
  display_status text not null,
  risk_level text not null,
  investment_krw numeric(14, 2) not null,
  expected_revenue_krw numeric(14, 2) not null,
  base_npv_krw numeric(14, 2) not null,
  base_irr numeric(8, 6) not null,
  base_payback numeric(8, 2) not null
) on commit drop;

insert into seed_projects (
  id,
  code,
  name,
  department_code,
  business_type,
  workflow_status,
  display_status,
  risk_level,
  investment_krw,
  expected_revenue_krw,
  base_npv_krw,
  base_irr,
  base_payback
)
values
  ('20000000-0000-0000-0000-000000000001', 'PJ-2026-001', '삼성전자 주식 포트폴리오', 'HQ01', 'equity', 'approved', '승인', '중간', 800000000, 1120000000, 120000000, 0.142000, 2.80),
  ('20000000-0000-0000-0000-000000000002', 'PJ-2026-002', 'KOSPI200 ETF 운용', 'HQ01', 'equity', 'approved', '승인', '중간', 500000000, 750000000, 75000000, 0.118000, 3.00),
  ('20000000-0000-0000-0000-000000000003', 'PJ-2026-003', '국고채 10년 포트폴리오', 'HQ01', 'bond', 'approved', '승인', '낮음', 1200000000, 1800000000, 180000000, 0.065000, 4.20),
  ('20000000-0000-0000-0000-000000000004', 'PJ-2026-004', '해외 채권형 펀드', 'HQ01', 'fund', 'approved', '승인', '중간', 900000000, 1400000000, 95000000, 0.081000, 4.00),
  ('20000000-0000-0000-0000-000000000005', 'PJ-2026-005', '신용리스크 측정 엔진', 'HQ02', 'risk_project', 'in_review', '조건부 진행', '중간', 650000000, 980000000, 65000000, 0.099000, 3.60),
  ('20000000-0000-0000-0000-000000000006', 'PJ-2026-006', '금리스왑(IRS) 운용', 'HQ02', 'derivative', 'in_review', '조건부 진행', '중간', 450000000, 680000000, 42000000, 0.072000, 3.90),
  ('20000000-0000-0000-0000-000000000007', 'PJ-2026-007', 'FX 옵션 북', 'HQ02', 'derivative', 'in_review', '검토중', '높음', 300000000, 480000000, 18000000, 0.054000, 4.40),
  ('20000000-0000-0000-0000-000000000008', 'PJ-2026-008', 'ALM 모델 고도화', 'HQ02', 'risk_project', 'draft', '검토중', '중간', 400000000, 520000000, 25000000, 0.063000, 4.60),
  ('20000000-0000-0000-0000-000000000009', 'PJ-2026-009', 'IFRS17 원가배분', 'HQ03', 'accounting_project', 'in_review', '조건부 진행', '낮음', 550000000, 830000000, 70000000, 0.117000, 3.80),
  ('20000000-0000-0000-0000-000000000010', 'PJ-2026-010', '관리회계 BI 고도화', 'HQ03', 'accounting_project', 'in_review', '조건부 진행', '낮음', 480000000, 710000000, 64000000, 0.111000, 3.90),
  ('20000000-0000-0000-0000-000000000011', 'PJ-2026-011', '회사채 AA급 포트폴리오', 'HQ03', 'bond', 'approved', '승인', '중간', 700000000, 980000000, 88000000, 0.069000, 4.10),
  ('20000000-0000-0000-0000-000000000012', 'PJ-2026-012', '선박유동화 펀드(SPC)', 'HQ03', 'fund', 'rejected', '보류', '높음', 1100000000, 900000000, -150000000, 0.041000, 6.00),
  ('20000000-0000-0000-0000-000000000013', 'PJ-2026-013', '파생상품 가치평가 엔진', 'HQ04', 'valuation_project', 'approved', '승인', '중간', 850000000, 1250000000, 130000000, 0.132000, 3.10),
  ('20000000-0000-0000-0000-000000000014', 'PJ-2026-014', 'KOSPI 선물 차익거래', 'HQ04', 'derivative', 'approved', '승인', '중간', 600000000, 920000000, 72000000, 0.095000, 3.30),
  ('20000000-0000-0000-0000-000000000015', 'PJ-2026-015', '주식형 ELS 발행', 'HQ04', 'derivative', 'in_review', '검토중', '높음', 950000000, 1100000000, 115000000, 0.103000, 4.90),
  ('20000000-0000-0000-0000-000000000016', 'PJ-2026-016', '리스크 시나리오 시뮬레이터', 'HQ04', 'risk_project', 'in_review', '검토중', '중간', 520000000, 740000000, 52000000, 0.088000, 4.30),
  ('20000000-0000-0000-0000-000000000017', 'PJ-2026-017', '인터페이스 통합관리 플랫폼', 'HQ05', 'it_project', 'in_review', '조건부 진행', '낮음', 780000000, 1120000000, 98000000, 0.124000, 3.50),
  ('20000000-0000-0000-0000-000000000018', 'PJ-2026-018', '감사로그 중앙화 시스템', 'HQ05', 'it_project', 'in_review', '조건부 진행', '낮음', 420000000, 680000000, 55000000, 0.119000, 3.70),
  ('20000000-0000-0000-0000-000000000019', 'PJ-2026-019', 'AI 기반 이상거래 탐지', 'HQ05', 'it_project', 'draft', '검토중', '중간', 680000000, 920000000, 84000000, 0.127000, 4.10),
  ('20000000-0000-0000-0000-000000000020', 'PJ-2026-020', '테슬라 해외주식 포트폴리오', 'HQ01', 'equity', 'approved', '승인', '높음', 650000000, 950000000, 95000000, 0.126000, 3.60);

insert into projects (id, code, name, business_type, status, description)
select
  id,
  code,
  name,
  business_type,
  workflow_status,
  display_status || ' / ' || department_code || ' / 리스크 ' || risk_level || ' / 5개 본부·20개 프로젝트 포트폴리오 시드'
from seed_projects
order by code;

create temporary table seed_scenario_templates (
  scenario_code text not null,
  scenario_name text not null,
  description text not null,
  npv_multiplier numeric(6, 3) not null,
  irr_delta numeric(6, 3) not null,
  payback_delta numeric(6, 2) not null,
  discount_rate numeric(8, 6) not null,
  is_baseline boolean not null,
  is_active boolean not null
) on commit drop;

insert into seed_scenario_templates (
  scenario_code,
  scenario_name,
  description,
  npv_multiplier,
  irr_delta,
  payback_delta,
  discount_rate,
  is_baseline,
  is_active
)
values
  ('OPT', '낙관 시나리오', '신계약 증가율 상향 및 손해율 안정 가정', 1.300, 0.018, -0.40, 0.105000, false, false),
  ('BASE', '기준 시나리오', '포트폴리오 기본 가정과 내부 표준원가 적용', 1.000, 0.000, 0.00, 0.115000, true, true),
  ('DOWN', '비관 시나리오', '손해율 상승 및 판매효율 저하 반영', 0.650, -0.022, 0.60, 0.125000, false, false);

insert into scenarios (id, project_id, name, description, is_baseline, is_active)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  p.id,
  t.scenario_name,
  t.description,
  t.is_baseline,
  t.is_active
from (
  select
    sp.*,
    st.*,
    md5(sp.code || ':' || st.scenario_code) as hash_text
  from seed_projects sp
  cross join seed_scenario_templates st
) p
join seed_scenario_templates t
  on t.scenario_code = p.scenario_code
order by p.code, t.scenario_code;

insert into cost_pools (id, project_id, scenario_id, name, category, amount, currency, description)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  p.id,
  s.id,
  pool_name,
  category,
  amount,
  'KRW',
  p.description
from (
  select
    sp.id,
    sp.code,
    st.id as scenario_id,
    cp.pool_code,
    cp.pool_name,
    cp.category,
    round(sp.investment_krw * cp.ratio, 2) as amount,
    cp.description,
    md5(sp.code || ':' || cp.pool_code) as hash_text
  from seed_projects sp
  join scenarios st
    on st.project_id = sp.id
   and st.name = '기준 시나리오'
  cross join (
    values
      ('STD-LABOR', '인력 표준원가', 'personnel', 0.360::numeric, '프로젝트 직접 인력과 본부 공통 인력을 표준원가 기준으로 집계'),
      ('STD-SHARED', '본부 공통원가', 'shared', 0.220::numeric, '본부 공통 운영원가와 전사 간접비를 집계'),
      ('TRANSFER-IT', '내부대체가액-플랫폼', 'it', 0.260::numeric, 'IT 플랫폼과 데이터 허브의 내부대체가액'),
      ('VENDOR-EXT', '외부벤더원가', 'vendor', 0.160::numeric, '외주 개발 및 운영 파트너 비용')
  ) as cp(pool_code, pool_name, category, ratio, description)
) p
join scenarios s
  on s.id = p.scenario_id
order by p.code, p.pool_code;

insert into allocation_rules (id, project_id, scenario_id, cost_pool_id, department_id, basis, allocation_rate, allocated_amount)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  project_id,
  scenario_id,
  cost_pool_id,
  department_id,
  basis,
  allocation_rate,
  round(pool_amount * allocation_rate, 2) as allocated_amount
from (
  select
    sp.id as project_id,
    sc.id as scenario_id,
    cp.id as cost_pool_id,
    cp.amount as pool_amount,
    d.id as department_id,
    case cp.name
      when '인력 표준원가' then 'headcount'
      when '본부 공통원가' then 'revenue'
      when '내부대체가액-플랫폼' then 'transaction_count'
      else 'manual'
    end as basis,
    case
      when cp.name = '인력 표준원가' and d.code = sp.department_code then 0.550000::numeric
      when cp.name = '인력 표준원가' then 0.112500::numeric
      when cp.name = '본부 공통원가' and d.code = sp.department_code then 0.400000::numeric
      when cp.name = '본부 공통원가' then 0.150000::numeric
      when cp.name = '내부대체가액-플랫폼' and sp.department_code = 'HQ05' and d.code = 'HQ05' then 0.600000::numeric
      when cp.name = '내부대체가액-플랫폼' and sp.department_code = 'HQ05' then 0.100000::numeric
      when cp.name = '내부대체가액-플랫폼' and d.code = 'HQ05' then 0.350000::numeric
      when cp.name = '내부대체가액-플랫폼' and d.code = sp.department_code then 0.250000::numeric
      when cp.name = '내부대체가액-플랫폼' then 0.133333::numeric
      when cp.name = '외부벤더원가' and d.code = sp.department_code then 0.700000::numeric
      when cp.name = '외부벤더원가' then 0.075000::numeric
      else 0.200000::numeric
    end as allocation_rate,
    md5(sp.code || ':' || cp.name || ':' || d.code) as hash_text
  from seed_projects sp
  join scenarios sc
    on sc.project_id = sp.id
   and sc.name = '기준 시나리오'
  join cost_pools cp
    on cp.project_id = sp.id
   and cp.scenario_id = sc.id
  cross join seed_departments d
) alloc
order by project_id, cost_pool_id, department_id;

insert into cash_flows (
  id,
  project_id,
  scenario_id,
  period_no,
  period_label,
  year_label,
  operating_cash_flow,
  investment_cash_flow,
  financing_cash_flow,
  net_cash_flow,
  discount_rate
)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  project_id,
  scenario_id,
  period_no,
  period_label,
  year_label,
  operating_cash_flow,
  investment_cash_flow,
  0,
  operating_cash_flow + investment_cash_flow,
  discount_rate
from (
  select
    sp.id as project_id,
    sc.id as scenario_id,
    sc.name as scenario_name,
    st.discount_rate,
    cf.period_no,
    cf.period_label,
    cf.year_label,
    case
      when cf.period_no = 0 then 0
      else round(sp.expected_revenue_krw * cf.revenue_weight * st.npv_multiplier, 2)
    end as operating_cash_flow,
    case
      when cf.period_no = 0 then -sp.investment_krw
      else 0
    end as investment_cash_flow,
    md5(sp.code || ':' || sc.name || ':' || cf.period_no::text) as hash_text
  from seed_projects sp
  join scenarios sc
    on sc.project_id = sp.id
  join seed_scenario_templates st
    on st.scenario_name = sc.name
  cross join (
    values
      (0, '투자시점', '2026', 0.000::numeric),
      (1, '1년차', '2027', 0.180::numeric),
      (2, '2년차', '2028', 0.220::numeric),
      (3, '3년차', '2029', 0.260::numeric),
      (4, '4년차', '2030', 0.340::numeric)
  ) as cf(period_no, period_label, year_label, revenue_weight)
) flow_rows
order by project_id, scenario_id, period_no;

insert into valuation_results (
  id,
  project_id,
  scenario_id,
  discount_rate,
  npv,
  irr,
  payback_period,
  decision,
  assumptions
)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  project_id,
  scenario_id,
  discount_rate,
  adjusted_npv,
  adjusted_irr,
  adjusted_payback,
  decision,
  assumptions
from (
  select
    sp.id as project_id,
    sc.id as scenario_id,
    st.discount_rate,
    case
      when sp.base_npv_krw >= 0 then round(sp.base_npv_krw * st.npv_multiplier, 2)
      else round(sp.base_npv_krw * (2 - st.npv_multiplier), 2)
    end as adjusted_npv,
    round(greatest(0.020000, sp.base_irr + st.irr_delta), 6) as adjusted_irr,
    round(greatest(1.80, sp.base_payback + st.payback_delta), 2) as adjusted_payback,
    case
      when st.scenario_code = 'DOWN' and sp.base_npv_krw < 0 then 'reject'
      when st.scenario_code = 'BASE' and sp.base_npv_krw < 500000000 then 'review'
      when st.scenario_code = 'BASE' and sp.base_npv_krw >= 500000000 then 'recommend'
      when st.scenario_code = 'OPT' and sp.base_npv_krw >= 0 then 'recommend'
      else 'review'
    end as decision,
    jsonb_build_object(
      'displayStatus', sp.display_status,
      'riskLevel', sp.risk_level,
      'discountRate', st.discount_rate,
      'scenarioCode', st.scenario_code,
      'ownerDepartment', sp.department_code,
      'costDrivers', jsonb_build_array('headcount', 'revenue', 'transaction_count', 'manual')
    ) as assumptions,
    md5(sp.code || ':' || st.scenario_code || ':valuation') as hash_text
  from seed_projects sp
  join scenarios sc
    on sc.project_id = sp.id
  join seed_scenario_templates st
    on st.scenario_name = sc.name
) valuation_rows
order by project_id, scenario_id;

insert into approval_logs (id, project_id, scenario_id, actor_role, actor_name, action, comment, created_at)
select
  (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid as id,
  project_id,
  scenario_id,
  actor_role,
  actor_name,
  action,
  comment,
  created_at
from (
  select
    sp.id as project_id,
    sc.id as scenario_id,
    ev.actor_role,
    ev.actor_name,
    ev.action,
    ev.comment,
    timestamp with time zone '2026-04-18 09:00:00+09' + ((sp.row_no - 1) * interval '12 minute') + ev.offset_interval as created_at,
    md5(sp.code || ':' || ev.event_code) as hash_text
  from (
    select
      row_number() over (order by code) as row_no,
      seed_projects.*
    from seed_projects
  ) sp
  join scenarios sc
    on sc.project_id = sp.id
   and sc.name = '기준 시나리오'
  cross join lateral (
    values
      ('created', 'planner', '기획담당', 'created', '프로젝트와 기준 시나리오를 생성했습니다.', interval '0 minute'),
      ('allocated', 'system', '배부엔진', 'allocated', '표준원가와 내부대체가액을 본부별로 배부했습니다.', interval '12 minute'),
      ('evaluated', 'finance_reviewer', '재무검토자', 'evaluated', 'DCF 및 리스크 지표를 검토했습니다.', interval '24 minute'),
      (
        'decision',
        case when sp.workflow_status = 'approved' then 'executive' else 'finance_reviewer' end,
        case when sp.workflow_status = 'approved' then 'CFO' else '재무검토자' end,
        case when sp.workflow_status = 'approved' then 'approved' when sp.workflow_status = 'rejected' then 'rejected' else 'commented' end,
        case
          when sp.workflow_status = 'approved' then '포트폴리오 우선순위에 따라 승인했습니다.'
          when sp.workflow_status = 'rejected' then '리스크와 회수기간을 고려해 보류했습니다.'
          else '추가 가정 검토 후 재심의가 필요합니다.'
        end,
        interval '36 minute'
      )
  ) as ev(event_code, actor_role, actor_name, action, comment, offset_interval)
) audit_rows
order by project_id, created_at;

insert into users (id, username, email, display_name, role, division, status, mfa_enabled, password_hash)
values
  ('40000000-0000-0000-0000-000000000001', 'admin', 'admin@costwise.local', 'CostWise 관리자', 'ADMIN', '전사', 'ACTIVE', true, crypt('admin123', gen_salt('bf'))),
  ('40000000-0000-0000-0000-000000000002', 'cfo', 'cfo@costwise.local', '원가·평가 본부장', 'EXECUTIVE', '투자운용본부', 'ACTIVE', true, crypt('user123', gen_salt('bf'))),
  ('40000000-0000-0000-0000-000000000003', 'analyst', 'analyst@costwise.local', '원가 담당', 'ACCOUNTANT', '재무회계본부', 'ACTIVE', false, crypt('user123', gen_salt('bf'))),
  ('40000000-0000-0000-0000-000000000004', 'viewer', 'viewer@costwise.local', '감사/열람 담당', 'AUDITOR', '전사', 'ACTIVE', false, crypt('user123', gen_salt('bf')));

insert into workflow_states (project_id, status, last_action, updated_at)
select
  sp.id::text,
  case
    when sp.workflow_status = 'approved' then 'APPROVED'
    when sp.workflow_status = 'rejected' then 'REJECTED'
    when sp.workflow_status = 'draft' then 'DRAFT'
    else 'REVIEW'
  end,
  case
    when sp.workflow_status = 'approved' then 'APPROVE'
    when sp.workflow_status = 'rejected' then 'REJECT'
    when sp.workflow_status = 'draft' then 'INIT'
    else 'REQUEST_REVIEW'
  end,
  timestamp with time zone '2026-04-24 09:00:00+09' + ((row_number() over (order by sp.code) - 1) * interval '10 minute')
from seed_projects sp;

insert into audit_logs (
  project_id,
  event_type,
  actor_role,
  actor_id,
  action,
  target,
  result,
  metadata,
  request_context,
  occurred_at
)
select
  sp.id::text,
  'PROJECT_WORKFLOW',
  case
    when sp.workflow_status = 'approved' then 'executive'
    when sp.workflow_status = 'rejected' then 'executive'
    else 'finance_reviewer'
  end,
  case
    when sp.workflow_status = 'approved' then 'exec.hq01'
    when sp.workflow_status = 'rejected' then 'exec.hq01'
    else 'review.bot'
  end,
  case
    when sp.workflow_status = 'approved' then 'APPROVE'
    when sp.workflow_status = 'rejected' then 'REJECT'
    when sp.workflow_status = 'draft' then 'CREATE'
    else 'REVIEW'
  end,
  '/api/projects/' || sp.id::text || '/workflow',
  'SUCCESS',
  jsonb_build_object(
    'projectCode', sp.code,
    'displayStatus', sp.display_status,
    'riskLevel', sp.risk_level
  )::text,
  jsonb_build_object(
    'source', 'supabase-seed',
    'seedVersion', '2026-04-24-ref-webapp'
  )::text,
  timestamp with time zone '2026-04-24 09:30:00+09' + ((row_number() over (order by sp.code) - 1) * interval '7 minute')
from seed_projects sp;

commit;
