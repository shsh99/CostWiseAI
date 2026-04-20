begin;

truncate table approval_logs, valuation_results, cash_flows, allocation_rules, cost_pools, scenarios, departments, projects restart identity cascade;

create temporary table seed_departments (
  id uuid primary key,
  code text not null,
  name text not null,
  sort_order integer not null
) on commit drop;

insert into seed_departments (id, code, name, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', 'UND', '언더라이팅본부', 1),
  ('10000000-0000-0000-0000-000000000002', 'PROD', '상품개발본부', 2),
  ('10000000-0000-0000-0000-000000000003', 'SALES', '영업본부', 3),
  ('10000000-0000-0000-0000-000000000004', 'IT', 'IT본부', 4),
  ('10000000-0000-0000-0000-000000000005', 'CORP', '경영지원본부', 5);

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
  ('20000000-0000-0000-0000-000000000001', 'UND-2026-001', '암보험 신상품 출시', 'UND', 'insurance_product', 'approved', '승인', '중간', 6500000000, 11200000000, 2100000000, 0.182000, 2.80),
  ('20000000-0000-0000-0000-000000000002', 'UND-2026-002', '인수심사 자동화', 'UND', 'underwriting_process', 'in_review', '조건부 진행', '낮음', 4200000000, 8100000000, 1700000000, 0.171000, 3.10),
  ('20000000-0000-0000-0000-000000000003', 'UND-2026-003', '위험요율 재설계', 'UND', 'pricing_model', 'in_review', '검토중', '중간', 3100000000, 5900000000, 900000000, 0.129000, 3.80),
  ('20000000-0000-0000-0000-000000000004', 'UND-2026-004', '사전심사 대시보드', 'UND', 'operations_tool', 'rejected', '보류', '높음', 2800000000, 4700000000, -400000000, 0.094000, 4.60),
  ('20000000-0000-0000-0000-000000000005', 'PROD-2026-001', '디지털 건강보험', 'PROD', 'insurance_product', 'approved', '승인', '중간', 5400000000, 9800000000, 2400000000, 0.194000, 2.50),
  ('20000000-0000-0000-0000-000000000006', 'PROD-2026-002', '가족보험 패키지', 'PROD', 'insurance_product', 'in_review', '조건부 진행', '낮음', 4600000000, 8300000000, 1500000000, 0.161000, 3.00),
  ('20000000-0000-0000-0000-000000000007', 'PROD-2026-003', '특약 정비', 'PROD', 'product_optimization', 'in_review', '검토중', '중간', 3000000000, 4900000000, 300000000, 0.112000, 4.20),
  ('20000000-0000-0000-0000-000000000008', 'PROD-2026-004', '상품약관 자동화', 'PROD', 'document_automation', 'rejected', '보류', '높음', 2500000000, 4100000000, -700000000, 0.089000, 4.80),
  ('20000000-0000-0000-0000-000000000009', 'SALES-2026-001', 'GA 영업지원 포털', 'SALES', 'sales_channel', 'approved', '승인', '중간', 4900000000, 9500000000, 1900000000, 0.168000, 2.90),
  ('20000000-0000-0000-0000-000000000010', 'SALES-2026-002', '설계사 리드분배', 'SALES', 'sales_automation', 'in_review', '조건부 진행', '낮음', 3800000000, 7200000000, 1100000000, 0.143000, 3.40),
  ('20000000-0000-0000-0000-000000000011', 'SALES-2026-003', '모바일 견적 고도화', 'SALES', 'sales_automation', 'in_review', '검토중', '중간', 3100000000, 5600000000, 200000000, 0.108000, 4.10),
  ('20000000-0000-0000-0000-000000000012', 'SALES-2026-004', '채널 수익성 분석', 'SALES', 'profitability_analysis', 'rejected', '보류', '높음', 2700000000, 4300000000, -900000000, 0.081000, 5.00),
  ('20000000-0000-0000-0000-000000000013', 'IT-2026-001', '디지털 플랫폼 구축', 'IT', 'platform', 'approved', '승인', '중간', 7800000000, 13600000000, 3500000000, 0.207000, 2.30),
  ('20000000-0000-0000-0000-000000000014', 'IT-2026-002', '마이데이터 연계', 'IT', 'data_integration', 'in_review', '조건부 진행', '낮음', 5900000000, 10700000000, 2000000000, 0.176000, 2.80),
  ('20000000-0000-0000-0000-000000000015', 'IT-2026-003', '데이터허브 확장', 'IT', 'data_platform', 'in_review', '검토중', '중간', 4300000000, 7400000000, 800000000, 0.131000, 3.70),
  ('20000000-0000-0000-0000-000000000016', 'IT-2026-004', '콜센터 고도화', 'IT', 'operations_tool', 'rejected', '보류', '높음', 3900000000, 6200000000, -1100000000, 0.079000, 5.20),
  ('20000000-0000-0000-0000-000000000017', 'CORP-2026-001', '원가배분 체계개편', 'CORP', 'cost_accounting', 'in_review', '검토중', '낮음', 2900000000, 5300000000, 600000000, 0.122000, 3.90),
  ('20000000-0000-0000-0000-000000000018', 'CORP-2026-002', '감사로그 표준화', 'CORP', 'governance', 'in_review', '조건부 진행', '낮음', 2400000000, 4500000000, 400000000, 0.117000, 4.00),
  ('20000000-0000-0000-0000-000000000019', 'CORP-2026-003', '성과관리 대시보드', 'CORP', 'performance_management', 'in_review', '검토중', '중간', 3200000000, 5100000000, -300000000, 0.097000, 4.40),
  ('20000000-0000-0000-0000-000000000020', 'CORP-2026-004', '권한통제 재설계', 'CORP', 'security_control', 'rejected', '보류', '높음', 2100000000, 3700000000, -1200000000, 0.074000, 5.60);

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
  description
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
      when cp.name = '내부대체가액-플랫폼' and sp.department_code = 'IT' and d.code = 'IT' then 0.600000::numeric
      when cp.name = '내부대체가액-플랫폼' and sp.department_code = 'IT' then 0.100000::numeric
      when cp.name = '내부대체가액-플랫폼' and d.code = 'IT' then 0.350000::numeric
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

commit;
