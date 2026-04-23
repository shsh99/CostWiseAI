/* eslint-disable no-unused-vars */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent as ReactFormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from 'react';
import { formatKrwCompact } from '../../app/format';
import {
  apiBaseUrl,
  createProject,
  isForbiddenApiError,
  type AssetCategory,
  type PortfolioSummary,
  type ProjectStatus,
  type ProjectSummary,
  type Role
} from '../../app/portfolioData';
import {
  canWriteProjects,
  getRoleLabel
} from '../../features/auth/permissions';
import { Panel } from '../../shared/components/Panel';
import { ProgressBar } from '../../shared/components/ProgressBar';
import {
  filterAndSortProjects,
  explorerQuickFilterOptions,
  explorerSortOptions
} from '../../features/portfolio/explorerFilters';
import {
  statusTone,
  type ExplorerQuickFilterKey,
  type ExplorerSortKey
} from '../../features/portfolio/explorerState';

const riskToneMap = {
  낮음: 'low',
  중간: 'mid',
  높음: 'high'
} as const;

const projectStatusFilterOptions: Array<{
  key: 'all' | ProjectStatus;
  label: string;
}> = [
  { key: 'all', label: '전체 상태' },
  { key: '검토중', label: '검토중' },
  { key: '조건부 진행', label: '조건부' },
  { key: '보류', label: '보류' },
  { key: '승인', label: '승인' }
];

const projectStatusOptions: ProjectStatus[] = [
  '검토중',
  '조건부 진행',
  '보류',
  '승인'
];

const assetCategoryOptions: AssetCategory[] = [
  '주식',
  '채권',
  '파생상품',
  '프로젝트'
];

const apiLookupAccessToken =
  import.meta.env.VITE_API_ACCESS_TOKEN ??
  import.meta.env.VITE_SUPABASE_ACCESS_TOKEN ??
  '';

type ProjectEditDraft = Pick<
  ProjectSummary,
  'name' | 'status' | 'headquarter' | 'investmentKrw' | 'expectedRevenueKrw'
>;

type ProjectEditFormState = {
  name: string;
  status: ProjectStatus;
  headquarter: string;
  investmentKrw: string;
  expectedRevenueKrw: string;
};

type ProjectCreateFormState = {
  code: string;
  name: string;
  assetCategory: AssetCategory;
  status: ProjectStatus;
  headquarter: string;
  investmentKrw: string;
  expectedRevenueKrw: string;
};

type ProjectLookupState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  symbol: string;
  error: string | null;
  summary: {
    symbol: string;
    assetCategory: AssetCategory;
    exchange: string | null;
    regularMarketPrice: number | null;
    regularMarketChange: number | null;
    regularMarketChangePercent: number | null;
  } | null;
};

function createProjectEditFormState(
  project: ProjectSummary
): ProjectEditFormState {
  return {
    name: project.name,
    status: project.status,
    headquarter: project.headquarter,
    investmentKrw: String(project.investmentKrw),
    expectedRevenueKrw: String(project.expectedRevenueKrw)
  };
}

function createProjectCreateFormState(
  defaultHeadquarter: string
): ProjectCreateFormState {
  return {
    code: '',
    name: '',
    assetCategory: '프로젝트',
    status: '검토중',
    headquarter: defaultHeadquarter,
    investmentKrw: '',
    expectedRevenueKrw: ''
  };
}

function createProjectLookupState(): ProjectLookupState {
  return {
    status: 'idle',
    symbol: '',
    error: null,
    summary: null
  };
}

function extractLookupRecord(value: unknown): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const firstObject = value.find(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
    );

    return firstObject ?? null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const candidateKeys = ['result', 'quote', 'data', 'payload', 'results', 'quotes'];

  for (const key of candidateKeys) {
    const nested = extractLookupRecord(record[key]);
    if (nested) {
      return nested;
    }
  }

  return record;
}

function readLookupString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readLookupNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapLookupAssetCategory(record: Record<string, unknown>): AssetCategory {
  const hint = [
    readLookupString(record.assetClass),
    readLookupString(record.quoteType),
    readLookupString(record.typeDisp),
    readLookupString(record.instrumentType)
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  if (
    hint.includes('BOND') ||
    hint.includes('FIXED INCOME') ||
    hint.includes('TREASURY')
  ) {
    return '채권';
  }

  if (
    hint.includes('OPTION') ||
    hint.includes('FUTURE') ||
    hint.includes('SWAP') ||
    hint.includes('DERIV') ||
    hint.includes('FOREX') ||
    hint.includes('CURRENCY') ||
    hint.includes('CRYPTO')
  ) {
    return '파생상품';
  }

  if (
    hint.includes('EQUITY') ||
    hint.includes('ETF') ||
    hint.includes('FUND') ||
    hint.includes('STOCK') ||
    hint.includes('ADR') ||
    hint.includes('REIT')
  ) {
    return '주식';
  }

  return '프로젝트';
}

function generateExternalProjectCode(existingCodes: Iterable<string>): string {
  const existing = new Set(existingCodes);
  let nextCode = '';

  do {
    nextCode = `PJ-EXT-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()
      .padEnd(6, 'X')}`;
  } while (existing.has(nextCode));

  return nextCode;
}

function formatLookupMetric(value: number | null, maximumFractionDigits = 2): string {
  if (value === null) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

function readLookupErrorMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  return (
    readLookupString(record.message) ??
    readLookupString(record.error) ??
    readLookupString(record.detail)
  );
}

function createLookupApiError(message: string, status?: number) {
  const error = new Error(message) as Error & { status?: number };
  if (typeof status === 'number' && Number.isFinite(status)) {
    error.status = status;
  }
  return error;
}

function isForbiddenLookupError(error: unknown) {
  if (isForbiddenApiError(error)) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { status?: unknown }).status === 403;
}

function deriveProjectRisk(
  status: ProjectStatus,
  investmentKrw: number,
  expectedRevenueKrw: number
): ProjectSummary['risk'] {
  if (status === '보류' || investmentKrw >= 20000000000) {
    return '높음';
  }

  if (status === '검토중' || expectedRevenueKrw < investmentKrw) {
    return '중간';
  }

  return '낮음';
}

function deriveProjectMetrics(
  investmentKrw: number,
  expectedRevenueKrw: number,
  status: ProjectStatus
) {
  const profit = expectedRevenueKrw - investmentKrw;
  const statusWeight =
    status === '승인' ? 1 : status === '조건부 진행' ? 0.72 : status === '보류' ? 0.22 : 0.48;
  const npvKrw = Math.round(profit * statusWeight);
  const baseIrr = investmentKrw > 0 ? profit / investmentKrw : 0;
  const irr = Math.min(
    0.32,
    Math.max(0.02, Number((0.08 + baseIrr * 0.16 + statusWeight * 0.02).toFixed(3)))
  );
  const annualizedRevenue = Math.max(expectedRevenueKrw * 0.35, 1);
  const paybackYears = Number(
    Math.min(12, Math.max(1.2, investmentKrw / annualizedRevenue)).toFixed(1)
  );

  return { npvKrw, irr, paybackYears };
}

type PortfolioViewProps = {
  selectedRole: Role;
  portfolio: PortfolioSummary;
  portfolioStatus: 'loading' | 'ready' | 'error';
  portfolioError: string | null;
  maxHeadquarterInvestment: number;
  divisionScope: string | null;
  selectedProjectCode: string;
  searchTerm: string;
  explorerSort: ExplorerSortKey;
  explorerQuickFilter: ExplorerQuickFilterKey;
  headquarterFilter: string;
  headquarterOptions: string[];
  filteredProjects: PortfolioSummary['projects'];
  onChangeSearchTerm(value: string): void;
  onChangeSort(value: ExplorerSortKey): void;
  onChangeQuickFilter(value: ExplorerQuickFilterKey): void;
  onChangeHeadquarterFilter(value: string): void;
  onResetExplorerControls: () => void;
  onSelectProject(projectCode: string): void;
  onOpenWorkspace(
    target: 'accounting' | 'valuation',
    projectCode: string
  ): void;
  onRetryPortfolioLoad(): void;
};

export function PortfolioView({
  selectedRole,
  portfolio,
  portfolioStatus,
  portfolioError,
  maxHeadquarterInvestment,
  divisionScope,
  selectedProjectCode,
  searchTerm,
  explorerSort,
  explorerQuickFilter,
  headquarterFilter,
  headquarterOptions,
  filteredProjects,
  onChangeSearchTerm,
  onChangeSort,
  onChangeQuickFilter,
  onChangeHeadquarterFilter,
  onResetExplorerControls,
  onSelectProject,
  onOpenWorkspace,
  onRetryPortfolioLoad
}: PortfolioViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [createdProjects, setCreatedProjects] = useState<ProjectSummary[]>([]);
  const [projectEdits, setProjectEdits] = useState<
    Record<string, ProjectEditDraft>
  >({});
  const [modalProjectCode, setModalProjectCode] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'detail' | 'edit' | 'create'>(
    'detail'
  );
  const [editReturnMode, setEditReturnMode] = useState<'close' | 'detail'>(
    'close'
  );
  const [editForm, setEditForm] = useState<ProjectEditFormState | null>(null);
  const [createForm, setCreateForm] = useState<ProjectCreateFormState | null>(null);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [projectLookup, setProjectLookup] = useState<ProjectLookupState>(
    createProjectLookupState
  );
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalOpenerRef = useRef<HTMLElement | null>(null);

  const hasHeadquarters = portfolio.headquarters.length > 0;
  const hasProjects = portfolio.projects.length > 0;
  const isLoadingWithoutData = portfolioStatus === 'loading' && !hasProjects;
  const isErrorWithoutData = portfolioStatus === 'error' && !hasProjects;
  const isProjectWritable = canWriteProjects(selectedRole);
  const writeAccessMessage = `${getRoleLabel(selectedRole)} 역할은 포트폴리오를 읽기 전용으로 봅니다. 프로젝트 수정/등록 권한이 없습니다(403).`;
  const baseProjects = useMemo(
    () => [...portfolio.projects, ...createdProjects],
    [portfolio.projects, createdProjects]
  );
  const mergedProjects = useMemo(
    () =>
      baseProjects.map((project) => {
        const edit = projectEdits[project.code];
        return edit ? { ...project, ...edit } : project;
      }),
    [baseProjects, projectEdits]
  );
  const renderedHeadquarterOptions = useMemo(() => {
    const discoveredHeadquarters: string[] = [];
    const seenHeadquarters = new Set<string>();

    mergedProjects.forEach((project) => {
      const normalizedHeadquarter = project.headquarter.trim();

      if (!normalizedHeadquarter || seenHeadquarters.has(normalizedHeadquarter)) {
        return;
      }

      seenHeadquarters.add(normalizedHeadquarter);
      discoveredHeadquarters.push(normalizedHeadquarter);
    });

    return ['all', ...discoveredHeadquarters];
  }, [mergedProjects]);
  const resolvedHeadquarterFilter = renderedHeadquarterOptions.includes(
    headquarterFilter
  )
    ? headquarterFilter
    : 'all';
  const defaultCreateHeadquarter =
    divisionScope ??
    (resolvedHeadquarterFilter !== 'all' ? resolvedHeadquarterFilter : null) ??
    portfolio.headquarters[0]?.name ??
    renderedHeadquarterOptions.find((option) => option !== 'all') ??
    headquarterOptions.find((option) => option !== 'all') ??
    '';
  const projectsByCode = useMemo(
    () => new Map(mergedProjects.map((project) => [project.code, project])),
    [mergedProjects]
  );
  const recomputedFilteredProjects = useMemo(
    () =>
      filterAndSortProjects(mergedProjects, {
        headquarterFilter: resolvedHeadquarterFilter,
        searchTerm,
        quickFilter: explorerQuickFilter,
        sort: explorerSort
      }),
    [
      mergedProjects,
      resolvedHeadquarterFilter,
      searchTerm,
      explorerQuickFilter,
      explorerSort
    ]
  );
  const displayedProjects = useMemo(
    () =>
      statusFilter === 'all'
        ? recomputedFilteredProjects
        : recomputedFilteredProjects.filter(
            (project) => project.status === statusFilter
          ),
    [recomputedFilteredProjects, statusFilter]
  );
  const explicitSelectedProject =
    (selectedProjectCode ? projectsByCode.get(selectedProjectCode) : null) ?? null;
  const modalProject =
    (modalProjectCode ? projectsByCode.get(modalProjectCode) : null) ?? null;
  const isCreateModalOpen = modalMode === 'create' && createForm !== null;
  const isModalOpen = isCreateModalOpen || modalProjectCode !== null;

  useEffect(() => {
    if (modalMode === 'create' || !modalProjectCode || modalProject) {
      return;
    }

    setModalMode('detail');
    setEditReturnMode('close');
    setEditForm(null);
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
    setModalProjectCode(null);
  }, [modalMode, modalProject, modalProjectCode]);

  useEffect(() => {
    if (isProjectWritable) {
      return;
    }

    if (modalMode === 'edit') {
      setModalMode('detail');
      setEditReturnMode('close');
      setEditForm(null);
      setCreateForm(null);
      setCreateFormError(null);
      setProjectLookup(createProjectLookupState());
      return;
    }

    if (modalMode === 'create') {
      setModalMode('detail');
      setEditReturnMode('close');
      setEditForm(null);
      setCreateForm(null);
      setCreateFormError(null);
      setProjectLookup(createProjectLookupState());
      setModalProjectCode(null);
    }
  }, [isProjectWritable, modalMode]);

  useEffect(() => {
    if (headquarterFilter === resolvedHeadquarterFilter) {
      return;
    }

    onChangeHeadquarterFilter('all');
  }, [
    headquarterFilter,
    onChangeHeadquarterFilter,
    resolvedHeadquarterFilter
  ]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalMode('detail');
        setEditReturnMode('close');
        setEditForm(null);
        setCreateForm(null);
        setCreateFormError(null);
        setModalProjectCode(null);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = modalCardRef.current?.querySelectorAll<HTMLElement>(
        [
          'button:not([disabled])',
          '[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(', ')
      );

      if (!focusableElements || focusableElements.length === 0) {
        event.preventDefault();
        closeButtonRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
      if (modalOpenerRef.current?.isConnected) {
        modalOpenerRef.current.focus();
      }
      modalOpenerRef.current = null;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [isModalOpen, modalMode]);

  function openProjectModal(project: ProjectSummary, opener?: HTMLElement | null) {
    if (typeof opener !== 'undefined') {
      modalOpenerRef.current = opener;
    }
    setModalMode('detail');
    setEditReturnMode('close');
    setEditForm(null);
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
    setModalProjectCode(project.code);
  }

  function openProjectEditModal(
    project: ProjectSummary,
    options?: {
      opener?: HTMLElement | null;
      returnMode?: 'close' | 'detail';
    }
  ) {
    if (!isProjectWritable) {
      return;
    }

    if (options && 'opener' in options) {
      modalOpenerRef.current = options.opener ?? null;
    }
    setModalProjectCode(project.code);
    setModalMode('edit');
    setEditReturnMode(options?.returnMode ?? 'close');
    setEditForm(createProjectEditFormState(project));
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
  }

  function openProjectCreateModal(opener?: HTMLElement | null) {
    if (!isProjectWritable) {
      return;
    }

    if (typeof opener !== 'undefined') {
      modalOpenerRef.current = opener;
    }
    setModalProjectCode(null);
    setModalMode('create');
    setEditReturnMode('close');
    setEditForm(null);
    setCreateForm(createProjectCreateFormState(defaultCreateHeadquarter));
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
  }

  function resetOperationalFilters() {
    setStatusFilter('all');
    onResetExplorerControls();
  }

  function handleWorkspaceEntry(
    target: 'accounting' | 'valuation',
    projectCode: string
  ) {
    onSelectProject(projectCode);
    onOpenWorkspace(target, projectCode);
    handleModalClose();
  }

  function handleModalClose() {
    setModalMode('detail');
    setEditReturnMode('close');
    setEditForm(null);
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
    setModalProjectCode(null);
  }

  function handleEditCancel() {
    if (editReturnMode === 'detail') {
      setModalMode('detail');
      setEditForm(null);
      return;
    }

    handleModalClose();
  }

  function handleEditSubmit(event: ReactFormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isProjectWritable || !modalProject || !editForm) {
      return;
    }

    const name = editForm.name.trim();
    const headquarter = editForm.headquarter.trim();
    const investmentKrw = Number(editForm.investmentKrw);
    const expectedRevenueKrw = Number(editForm.expectedRevenueKrw);

    if (
      !name ||
      !headquarter ||
      !Number.isFinite(investmentKrw) ||
      !Number.isFinite(expectedRevenueKrw)
    ) {
      return;
    }

    setProjectEdits((currentEdits) => ({
      ...currentEdits,
      [modalProject.code]: {
        name,
        status: editForm.status,
        headquarter,
        investmentKrw,
        expectedRevenueKrw
      }
    }));

    if (editReturnMode === 'detail') {
      setModalMode('detail');
      setEditForm(null);
      return;
    }

    handleModalClose();
  }

  async function handleCreateSubmit(event: ReactFormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isProjectWritable || !createForm) {
      return;
    }

    const code = createForm.code.trim().toUpperCase();
    const name = createForm.name.trim();
    const headquarter = createForm.headquarter.trim();
    const investmentKrw = Number(createForm.investmentKrw);
    const expectedRevenueKrw = Number(createForm.expectedRevenueKrw);

    if (!code || !name || !headquarter) {
      setCreateFormError('프로젝트 코드, 프로젝트명, 본부를 모두 입력하세요.');
      return;
    }

    if (divisionScope && headquarter !== divisionScope) {
      setCreateFormError(
        `현재 역할의 본부 범위는 ${divisionScope}입니다. 다른 본부로는 등록할 수 없습니다.`
      );
      return;
    }

    if (
      !Number.isFinite(investmentKrw) ||
      !Number.isFinite(expectedRevenueKrw) ||
      investmentKrw < 0 ||
      expectedRevenueKrw < 0
    ) {
      setCreateFormError('투자액과 예상 매출은 0 이상의 숫자로 입력하세요.');
      return;
    }

    if (projectsByCode.has(code)) {
      setCreateFormError('같은 프로젝트 코드를 이미 사용 중입니다.');
      return;
    }

    setCreateFormError(null);

    let createdProjectId = '';
    try {
      const createdProject = await createProject({
        code,
        name,
        businessType: headquarter,
        description: `${headquarter} · ${createForm.assetCategory} · ${createForm.status}`
      });
      createdProjectId = createdProject.id;
    } catch (error) {
      setCreateFormError(
        isForbiddenApiError(error)
          ? '프로젝트 생성 권한이 없습니다(403). 등록 권한을 확인하세요.'
          : error instanceof Error
            ? error.message
            : '프로젝트 생성 중 알 수 없는 오류가 발생했습니다.'
      );
      return;
    }

    const { npvKrw, irr, paybackYears } = deriveProjectMetrics(
      investmentKrw,
      expectedRevenueKrw,
      createForm.status
    );
    const highestRank = baseProjects.reduce(
      (maxRank, project) => Math.max(maxRank, project.rank),
      0
    );
    const newProject: ProjectSummary = {
      projectId: createdProjectId,
      rank: highestRank + 1,
      code,
      name,
      headquarter,
      investmentKrw,
      expectedRevenueKrw,
      npvKrw,
      irr,
      paybackYears,
      status: createForm.status,
      risk: deriveProjectRisk(
        createForm.status,
        investmentKrw,
        expectedRevenueKrw
      ),
      assetCategory: createForm.assetCategory
    };

    setCreatedProjects((currentProjects) => [...currentProjects, newProject]);
    setModalProjectCode(code);
    setModalMode('detail');
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
  }

  async function handleProjectLookup() {
    if (!isProjectWritable) {
      return;
    }

    const symbol = projectLookup.symbol.trim().toUpperCase();

    if (!symbol) {
      setProjectLookup((currentLookup) => ({
        ...currentLookup,
        status: 'error',
        error: '조회할 Yahoo ticker를 입력하세요.',
        summary: null
      }));
      return;
    }

    setProjectLookup((currentLookup) => ({
      ...currentLookup,
      status: 'loading',
      error: null
    }));

    try {
      const headers = new Headers({ Accept: 'application/json' });
      if (apiLookupAccessToken.trim()) {
        headers.set('Authorization', `Bearer ${apiLookupAccessToken.trim()}`);
      }
      const response = await fetch(
        `${apiBaseUrl}/api/projects/import/lookup?symbol=${encodeURIComponent(symbol)}`,
        {
          method: 'GET',
          headers
        }
      );
      const rawText = await response.text();
      let payload: unknown = null;

      if (rawText) {
        try {
          payload = JSON.parse(rawText) as unknown;
        } catch {
          payload = rawText;
        }
      }

      if (!response.ok) {
        throw createLookupApiError(
          readLookupErrorMessage(payload) ??
            `Ticker 조회에 실패했습니다. (${response.status})`,
          response.status
        );
      }

      const lookupRecord = extractLookupRecord(payload);
      if (!lookupRecord) {
        throw new Error('조회 결과를 해석하지 못했습니다.');
      }

      const resolvedSymbol = readLookupString(lookupRecord.symbol) ?? symbol;
      const shortName =
        readLookupString(lookupRecord.shortName) ??
        readLookupString(lookupRecord.longName) ??
        resolvedSymbol;
      const assetCategory = mapLookupAssetCategory(lookupRecord);
      const exchange =
        readLookupString(lookupRecord.fullExchangeName) ??
        readLookupString(lookupRecord.exchange);
      const regularMarketPrice = readLookupNumber(
        lookupRecord.regularMarketPrice
      );
      const regularMarketChange = readLookupNumber(
        lookupRecord.regularMarketChange
      );
      const regularMarketChangePercent = readLookupNumber(
        lookupRecord.regularMarketChangePercent
      );

      setCreateForm((currentForm) =>
        currentForm
          ? {
              ...currentForm,
              code:
                currentForm.code.trim() ||
                generateExternalProjectCode(projectsByCode.keys()),
              name: `${shortName} (${resolvedSymbol})`,
              assetCategory
            }
          : currentForm
      );
      setCreateFormError(null);
      setProjectLookup({
        status: 'success',
        symbol: resolvedSymbol,
        error: null,
        summary: {
          symbol: resolvedSymbol,
          assetCategory,
          exchange,
          regularMarketPrice,
          regularMarketChange,
          regularMarketChangePercent
        }
      });
    } catch (error) {
      const message = isForbiddenLookupError(error)
        ? '티커 조회 권한이 없습니다(403). 조회 권한을 요청하거나 수동으로 등록하세요.'
        : error instanceof Error
          ? error.message
          : 'Ticker 조회 중 알 수 없는 오류가 발생했습니다.';

      setProjectLookup((currentLookup) => ({
        ...currentLookup,
        status: 'error',
        error: `${message} 수동 등록은 계속 가능합니다.`,
        summary: null
      }));
    }
  }

  function handleModalSurfaceKeydown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      handleModalClose();
    }
  }

  return (
    <section className="portfolio-grid portfolio-grid--operations">
      <Panel
        title="프로젝트"
        subtitle="20여개 프로젝트 동시 평가·관리"
      >
        {portfolioStatus === 'loading' && !hasHeadquarters ? (
          <div className="audit-state" role="status">
            <strong>포트폴리오 본부 현황을 불러오는 중입니다.</strong>
            <p>API 응답을 기다리고 있습니다.</p>
          </div>
        ) : null}
        {portfolioStatus === 'error' && !hasHeadquarters ? (
          <div className="empty-state">
            <strong>포트폴리오 본부 현황을 불러오지 못했습니다.</strong>
            <p>
              {portfolioError ?? 'API 연결 상태를 확인한 뒤 다시 시도하세요.'}
            </p>
            <button type="button" onClick={onRetryPortfolioLoad}>
              다시 시도
            </button>
          </div>
        ) : null}
        {hasHeadquarters ? (
          <>
            <div className="portfolio-overview__meta" aria-label="포트폴리오 개요">
              <article className="portfolio-overview__meta-card">
                <span>총 투자액</span>
                <strong>
                  {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
                </strong>
              </article>
              <article className="portfolio-overview__meta-card">
                <span>평균 NPV</span>
                <strong>
                  {formatKrwCompact(portfolio.overview.averageNpvKrw)}
                </strong>
              </article>
              <article className="portfolio-overview__meta-card">
                <span>조건부 진행</span>
                <strong>{portfolio.overview.conditionalCount}개</strong>
              </article>
              <article className="portfolio-overview__meta-card">
                <span>승인 완료</span>
                <strong>{portfolio.overview.approvedCount}개</strong>
              </article>
            </div>

            <div className="headquarter-grid headquarter-grid--portfolio">
              {portfolio.headquarters.map((headquarter) => (
                <article
                  key={headquarter.code}
                  className="headquarter-card headquarter-card--portfolio"
                >
                  <div className="headquarter-card__header">
                    <div>
                      <strong>{headquarter.name}</strong>
                      <span>{headquarter.projectCount}개 프로젝트</span>
                    </div>
                    <span
                      className={`status-pill status-pill--${riskToneMap[headquarter.risk]}`}
                    >
                      {headquarter.risk}
                    </span>
                  </div>
                  <ProgressBar
                    label="투자 비중"
                    value={Math.round(headquarter.totalInvestmentKrw / 10000)}
                    max={Math.max(
                      1,
                      Math.round(maxHeadquarterInvestment / 10000)
                    )}
                    tone={
                      headquarter.risk === '높음'
                        ? 'rose'
                        : headquarter.risk === '중간'
                          ? 'amber'
                          : 'teal'
                    }
                  />
                  <div className="headquarter-card__metrics">
                    <div>
                      <span>총 투자액</span>
                      <strong>
                        {formatKrwCompact(headquarter.totalInvestmentKrw)}
                      </strong>
                    </div>
                    <div>
                      <span>평균 NPV</span>
                      <strong>
                        {formatKrwCompact(headquarter.averageNpvKrw)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </Panel>

      <Panel
        title="프로젝트 목록"
        subtitle="필터/검색 후 상세 분석으로 진입합니다."
      >
        {isErrorWithoutData ? (
          <div className="empty-state">
            <strong>프로젝트 목록을 불러오지 못했습니다.</strong>
            <p>{portfolioError ?? '잠시 후 다시 시도하세요.'}</p>
            <button type="button" onClick={onRetryPortfolioLoad}>
              다시 시도
            </button>
          </div>
        ) : null}

        {isLoadingWithoutData ? (
          <div className="audit-state" role="status">
            <strong>프로젝트 목록을 불러오는 중입니다.</strong>
            <p>필터와 테이블은 데이터 수신 후 활성화됩니다.</p>
          </div>
        ) : null}

        {!isErrorWithoutData && !isLoadingWithoutData ? (
          <div className="portfolio-ops">
            <div className="portfolio-ops__header">
              <div className="portfolio-ops__title">
                <p className="portfolio-ops__eyebrow">Project operations</p>
                <h3>프로젝트 관리</h3>
                <p>
                  탐색 조건을 빠르게 조합하고, 행 선택 후 상세 허브에서
                  컨텍스트 선택과 워크스페이스 진입을 마무리합니다.
                </p>
              </div>
              <div className="portfolio-ops__actions" aria-label="운영 액션">
                {isProjectWritable ? (
                  <button
                    type="button"
                    className="portfolio-action portfolio-action--secondary"
                    onClick={(event: ReactMouseEvent<HTMLButtonElement>) =>
                      openProjectCreateModal(event.currentTarget)
                    }
                  >
                    신규 프로젝트 등록
                  </button>
                ) : (
                  <p className="table-subtle">{writeAccessMessage}</p>
                )}
                <button
                  type="button"
                  className="portfolio-action portfolio-action--primary"
                  onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                    if (explicitSelectedProject) {
                      openProjectModal(
                        explicitSelectedProject,
                        event.currentTarget
                      );
                    }
                  }}
                  disabled={!explicitSelectedProject}
                >
                  선택 프로젝트 허브
                </button>
                {isProjectWritable ? (
                  <button
                    type="button"
                    className="portfolio-action portfolio-action--secondary"
                    onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                      if (explicitSelectedProject) {
                        openProjectEditModal(explicitSelectedProject, {
                          opener: event.currentTarget,
                          returnMode: 'close'
                        });
                      }
                    }}
                    disabled={!explicitSelectedProject}
                  >
                    프로젝트 편집
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="portfolio-filter-strip"
              aria-label="프로젝트 운영 필터"
            >
              <label
                className="portfolio-filter-strip__search"
                htmlFor="project-search-input"
              >
                <span>검색</span>
                <input
                  id="project-search-input"
                  type="search"
                  value={searchTerm}
                  placeholder="프로젝트명, 코드, 본부 검색"
                  onChange={(event) => onChangeSearchTerm(event.target.value)}
                />
              </label>

              <label
                className="portfolio-filter-strip__field"
                htmlFor="project-sort-select"
              >
                <span>정렬</span>
                <select
                  id="project-sort-select"
                  value={explorerSort}
                  onChange={(event) =>
                    onChangeSort(event.target.value as ExplorerSortKey)
                  }
                >
                  {explorerSortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className="portfolio-filter-strip__group"
                aria-label="빠른 필터"
              >
                <span className="portfolio-filter-strip__label">빠른 필터</span>
                {explorerQuickFilterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`portfolio-chip ${
                      explorerQuickFilter === filter.key
                        ? 'portfolio-chip--active'
                        : ''
                    }`}
                    aria-pressed={explorerQuickFilter === filter.key}
                    onClick={() => onChangeQuickFilter(filter.key)}
                    title={filter.helper}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div
                className="portfolio-filter-strip__group"
                aria-label="상태 필터"
              >
                <span className="portfolio-filter-strip__label">상태</span>
                {projectStatusFilterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`portfolio-chip portfolio-chip--subtle ${
                      statusFilter === filter.key ? 'portfolio-chip--active' : ''
                    }`}
                    aria-pressed={statusFilter === filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div
                className="portfolio-filter-strip__group"
                aria-label="본부 필터"
              >
                <span className="portfolio-filter-strip__label">본부</span>
                {renderedHeadquarterOptions.map((headquarter) => (
                  <button
                    key={headquarter}
                    type="button"
                    className={`portfolio-chip portfolio-chip--subtle ${
                      resolvedHeadquarterFilter === headquarter
                        ? 'portfolio-chip--active'
                        : ''
                    }`}
                    aria-pressed={resolvedHeadquarterFilter === headquarter}
                    onClick={() => onChangeHeadquarterFilter(headquarter)}
                  >
                    {headquarter === 'all' ? '전체 본부' : headquarter}
                  </button>
                ))}
              </div>
            </div>

            <div className="portfolio-ops__summary">
              <p>
                운영 대상 <strong>{displayedProjects.length}</strong> / 필터 결과{' '}
                {recomputedFilteredProjects.length} / 전체 {mergedProjects.length}
              </p>
              <div className="portfolio-ops__summary-actions">
                {explicitSelectedProject ? (
                  <span className="portfolio-ops__selection">
                    현재 선택 {explicitSelectedProject.name}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="explorer-reset"
                  onClick={resetOperationalFilters}
                >
                  필터 초기화
                </button>
              </div>
            </div>

            <div className="table-shell table-shell--operations">
              <table className="data-table data-table--operations">
                <thead>
                  <tr>
                    <th>우선</th>
                    <th>프로젝트</th>
                    <th>본부</th>
                    <th>상태</th>
                    <th>투자액</th>
                    <th>NPV</th>
                    <th>IRR</th>
                    <th>회수</th>
                    <th>허브</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProjects.map((project) => (
                    <tr
                      key={project.code}
                      className={`${
                        project.code === selectedProjectCode
                          ? 'data-table__row--selected'
                          : ''
                      } ${
                        project.code === modalProjectCode
                          ? 'data-table__row--modal'
                          : ''
                      }`}
                    >
                      <td>
                        <span className="table-rank">#{project.rank}</span>
                      </td>
                      <td>
                        <strong>{project.name}</strong>
                        <div className="table-subtle">
                          {project.code} · {project.assetCategory}
                        </div>
                      </td>
                      <td>{project.headquarter}</td>
                      <td>
                        <span
                          className={`status-pill status-pill--${statusTone(project.status)}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td>{formatKrwCompact(project.investmentKrw)}</td>
                      <td>{formatKrwCompact(project.npvKrw)}</td>
                      <td>{(project.irr * 100).toFixed(1)}%</td>
                      <td>{project.paybackYears.toFixed(1)}년</td>
                      <td>
                        <button
                          type="button"
                          className="table-link-button"
                          aria-label={`${project.name} 상세 허브 열기`}
                          onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                            openProjectModal(project, event.currentTarget);
                          }}
                        >
                          상세 허브
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayedProjects.length === 0 ? (
                <div className="empty-state">
                  <p>조건에 맞는 프로젝트가 없습니다.</p>
                  <button type="button" onClick={resetOperationalFilters}>
                    탐색 조건 초기화
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>

      {isCreateModalOpen || modalProject ? (
        <div className="portfolio-modal" role="presentation">
          <button
            type="button"
            className="portfolio-modal__backdrop"
            aria-label={
              modalMode === 'create'
                ? '프로젝트 등록 닫기'
                : modalMode === 'edit'
                  ? '프로젝트 편집 닫기'
                  : '상세 허브 닫기'
            }
            tabIndex={-1}
            onClick={handleModalClose}
          />
          <div
            ref={modalCardRef}
            className="portfolio-modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              modalMode === 'create'
                ? 'portfolio-create-modal-title'
                : modalMode === 'edit'
                ? 'portfolio-edit-modal-title'
                : 'portfolio-modal-title'
            }
            aria-describedby={
              modalMode === 'create'
                ? 'portfolio-create-modal-description'
                : modalMode === 'edit'
                ? 'portfolio-edit-modal-description'
                : 'portfolio-modal-description'
            }
            onKeyDown={handleModalSurfaceKeydown}
          >
            {modalMode === 'create' && createForm ? (
              <>
                <div className="portfolio-modal__header">
                  <div>
                    <p className="portfolio-modal__eyebrow">New project</p>
                    <h3 id="portfolio-create-modal-title">프로젝트 등록</h3>
                    <p id="portfolio-create-modal-description">
                      프로젝트 기본 정보를 입력하면 로컬 상태에 즉시 추가됩니다.
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="portfolio-modal__close"
                    onClick={handleModalClose}
                  >
                    닫기
                  </button>
                </div>

                <div className="portfolio-modal__band">
                  <span className="portfolio-modal__band-item">
                    <small>기본 자산군</small>
                    <strong>{createForm.assetCategory}</strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>현재 선택</small>
                    <strong>{explicitSelectedProject?.name ?? '선택 없음'}</strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>저장 방식</small>
                    <strong>프론트엔드 로컬 상태</strong>
                  </span>
                </div>

                <form className="portfolio-edit-form" onSubmit={handleCreateSubmit}>
                  <div className="portfolio-edit-form__field portfolio-edit-form__field--wide">
                    <span>Yahoo ticker lookup</span>
                    <input
                      type="text"
                      value={projectLookup.symbol}
                      placeholder="예: AAPL, 005930.KS"
                      onChange={(event) =>
                        setProjectLookup((currentLookup) => ({
                          ...currentLookup,
                          status:
                            currentLookup.status === 'error'
                              ? 'idle'
                              : currentLookup.status,
                          symbol: event.target.value,
                          error:
                            currentLookup.status === 'error'
                              ? null
                              : currentLookup.error
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleProjectLookup();
                        }
                      }}
                    />
                    <div className="portfolio-edit-form__actions">
                      <p className="portfolio-edit-form__hint">
                        {projectLookup.status === 'loading'
                          ? 'Yahoo ticker 정보를 조회하는 중입니다.'
                          : projectLookup.error ??
                            '조회 성공 시 코드, 프로젝트명, 자산군을 자동으로 채웁니다.'}
                      </p>
                      <div className="portfolio-edit-form__action-group">
                        <button
                          type="button"
                          className="portfolio-action portfolio-action--secondary"
                          onClick={() => void handleProjectLookup()}
                          disabled={projectLookup.status === 'loading'}
                        >
                          {projectLookup.status === 'loading' ? '조회 중...' : '조회'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {projectLookup.summary ? (
                    <div className="portfolio-modal__band" aria-label="ticker summary">
                      <span className="portfolio-modal__band-item">
                        <small>Symbol</small>
                        <strong>{projectLookup.summary.symbol}</strong>
                      </span>
                      <span className="portfolio-modal__band-item">
                        <small>Market</small>
                        <strong>
                          {projectLookup.summary.exchange ?? '시장 정보 없음'}
                        </strong>
                      </span>
                      <span className="portfolio-modal__band-item">
                        <small>Price / Change</small>
                        <strong>
                          {projectLookup.summary.regularMarketPrice === null
                            ? '시세 정보 없음'
                            : `${formatLookupMetric(
                                projectLookup.summary.regularMarketPrice
                              )} / ${formatLookupMetric(
                                projectLookup.summary.regularMarketChange
                              )} (${formatLookupMetric(
                                projectLookup.summary.regularMarketChangePercent
                              )}%)`}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  <div className="portfolio-edit-form__grid">
                    <label className="portfolio-edit-form__field">
                      <span>프로젝트 코드</span>
                      <input
                        type="text"
                        value={createForm.code}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, code: event.target.value }
                              : currentForm
                          );
                        }}
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field portfolio-edit-form__field--wide">
                      <span>프로젝트명</span>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, name: event.target.value }
                              : currentForm
                          );
                        }}
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>자산군</span>
                      <select
                        value={createForm.assetCategory}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  assetCategory: event.target.value as AssetCategory
                                }
                              : currentForm
                          );
                        }}
                      >
                        {assetCategoryOptions.map((assetCategory) => (
                          <option key={assetCategory} value={assetCategory}>
                            {assetCategory}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>상태</span>
                      <select
                        value={createForm.status}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  status: event.target.value as ProjectStatus
                                }
                              : currentForm
                          );
                        }}
                      >
                        {projectStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>본부</span>
                      <input
                        list="portfolio-headquarter-options"
                        type="text"
                        value={createForm.headquarter}
                        disabled={Boolean(divisionScope)}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, headquarter: event.target.value }
                              : currentForm
                          );
                        }}
                        required
                      />
                      <datalist id="portfolio-headquarter-options">
                        {renderedHeadquarterOptions
                          .filter((option) => option !== 'all')
                          .map((option) => (
                            <option key={option} value={option} />
                          ))}
                      </datalist>
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>투자액</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={createForm.investmentKrw}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  investmentKrw: event.target.value
                                }
                              : currentForm
                          );
                        }}
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>예상 매출</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={createForm.expectedRevenueKrw}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  expectedRevenueKrw: event.target.value
                                }
                              : currentForm
                          );
                        }}
                        required
                      />
                    </label>
                  </div>

                  <div className="portfolio-edit-form__actions">
                    <p className="portfolio-edit-form__hint">
                      {createFormError ??
                        (divisionScope
                          ? `등록 본부가 ${divisionScope}로 고정되어 있습니다.`
                          : '등록 후 즉시 테이블과 상세 허브에서 새 프로젝트를 사용할 수 있습니다.')}
                    </p>
                    <div className="portfolio-edit-form__action-group">
                      <button
                        type="button"
                        className="portfolio-action portfolio-action--secondary"
                        onClick={handleModalClose}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="portfolio-action portfolio-action--primary"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : modalMode === 'edit' && editForm && modalProject ? (
              <>
                <div className="portfolio-modal__header">
                  <div>
                    <p className="portfolio-modal__eyebrow">{modalProject.code}</p>
                    <h3 id="portfolio-edit-modal-title">프로젝트 편집</h3>
                    <p id="portfolio-edit-modal-description">
                      프로젝트명, 본부, 상태, 투자액, 예상 매출을 프론트엔드 상태에서만
                      수정합니다.
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="portfolio-modal__close"
                    onClick={handleModalClose}
                  >
                    닫기
                  </button>
                </div>

                <div className="portfolio-modal__band">
                  <span className="portfolio-modal__band-item">
                    <small>본부</small>
                    <strong>{modalProject.headquarter}</strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>현재 선택</small>
                    <strong>{explicitSelectedProject?.name ?? '선택 없음'}</strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>편집 대상</small>
                    <strong>{modalProject.code}</strong>
                  </span>
                </div>

                <form className="portfolio-edit-form" onSubmit={handleEditSubmit}>
                  <div className="portfolio-edit-form__grid">
                    <label className="portfolio-edit-form__field portfolio-edit-form__field--wide">
                      <span>프로젝트명</span>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, name: event.target.value }
                              : currentForm
                          )
                        }
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>상태</span>
                      <select
                        value={editForm.status}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  status: event.target.value as ProjectStatus
                                }
                              : currentForm
                          )
                        }
                      >
                        {projectStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>본부</span>
                      <input
                        list="portfolio-headquarter-options"
                        type="text"
                        value={editForm.headquarter}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, headquarter: event.target.value }
                              : currentForm
                          )
                        }
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>투자액</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={editForm.investmentKrw}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  investmentKrw: event.target.value
                                }
                              : currentForm
                          )
                        }
                        required
                      />
                    </label>

                    <label className="portfolio-edit-form__field">
                      <span>예상 매출</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={editForm.expectedRevenueKrw}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  expectedRevenueKrw: event.target.value
                                }
                              : currentForm
                          )
                        }
                        required
                      />
                    </label>
                  </div>

                  <div className="portfolio-edit-form__actions">
                    <p className="portfolio-edit-form__hint">
                      저장 즉시 운영 테이블, 본부 필터, 상세 허브 값이 갱신됩니다.
                    </p>
                    <div className="portfolio-edit-form__action-group">
                      <button
                        type="button"
                        className="portfolio-action portfolio-action--secondary"
                        onClick={handleEditCancel}
                      >
                        {editReturnMode === 'detail'
                          ? '상세 허브로 돌아가기'
                          : '취소'}
                      </button>
                      <button
                        type="submit"
                        className="portfolio-action portfolio-action--primary"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : modalProject ? (
              <>
                <div className="portfolio-modal__header">
                  <div>
                    <p className="portfolio-modal__eyebrow">{modalProject.code}</p>
                    <h3 id="portfolio-modal-title">{modalProject.name}</h3>
                    <p id="portfolio-modal-description">
                      운영 컨텍스트를 선택한 뒤 관리회계 또는 재무평가
                      워크스페이스로 이동합니다.
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="portfolio-modal__close"
                    onClick={handleModalClose}
                  >
                    닫기
                  </button>
                </div>

                <div className="portfolio-modal__band">
                  <span className="portfolio-modal__band-item">
                    <small>본부</small>
                    <strong>{modalProject.headquarter}</strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>상태</small>
                    <strong>
                      <span
                        className={`status-pill status-pill--${statusTone(modalProject.status)}`}
                      >
                        {modalProject.status}
                      </span>
                    </strong>
                  </span>
                  <span className="portfolio-modal__band-item">
                    <small>리스크</small>
                    <strong>
                      <span
                        className={`status-pill status-pill--${riskToneMap[modalProject.risk]}`}
                      >
                        {modalProject.risk}
                      </span>
                    </strong>
                  </span>
                </div>

                <div className="portfolio-modal__metrics">
                  <article className="portfolio-modal__metric">
                    <span>투자 예산</span>
                    <strong>{formatKrwCompact(modalProject.investmentKrw)}</strong>
                  </article>
                  <article className="portfolio-modal__metric">
                    <span>예상 매출</span>
                    <strong>
                      {formatKrwCompact(modalProject.expectedRevenueKrw)}
                    </strong>
                  </article>
                  <article className="portfolio-modal__metric">
                    <span>NPV</span>
                    <strong>{formatKrwCompact(modalProject.npvKrw)}</strong>
                  </article>
                  <article className="portfolio-modal__metric">
                    <span>IRR / 회수기간</span>
                    <strong>
                      {(modalProject.irr * 100).toFixed(1)}% ·{' '}
                      {modalProject.paybackYears.toFixed(1)}년
                    </strong>
                  </article>
                </div>

                <div className="portfolio-modal__workspace">
                  <div className="portfolio-modal__workspace-copy">
                    <span>Workspace entry</span>
                    <strong>선택 후 필요한 분석 레인으로 바로 진입</strong>
                    <p>
                      현재 행위는 기존 라우팅과 동일하며, 프로젝트 컨텍스트만 먼저
                      정리합니다.
                    </p>
                  </div>
                  <div className="portfolio-modal__workspace-actions">
                    {isProjectWritable ? (
                      <button
                        type="button"
                        className="portfolio-action portfolio-action--secondary"
                        onClick={() =>
                          openProjectEditModal(modalProject, {
                            returnMode: 'detail'
                          })
                        }
                      >
                        프로젝트 편집
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="portfolio-action portfolio-action--primary"
                      onClick={() => {
                        onSelectProject(modalProject.code);
                        handleModalClose();
                      }}
                    >
                      선택
                    </button>
                    <button
                      type="button"
                      className="portfolio-workspace-button portfolio-workspace-button--accounting"
                      onClick={() =>
                        handleWorkspaceEntry('accounting', modalProject.code)
                      }
                    >
                      관리회계
                    </button>
                    <button
                      type="button"
                      className="portfolio-workspace-button portfolio-workspace-button--valuation"
                      onClick={() =>
                        handleWorkspaceEntry('valuation', modalProject.code)
                      }
                    >
                      재무평가
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
