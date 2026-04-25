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
  type ProjectDetail,
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
import { ProjectDetailSection } from './ProjectDetailSection';

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
  const candidateKeys = [
    'result',
    'quote',
    'data',
    'payload',
    'results',
    'quotes'
  ];

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

function mapLookupAssetCategory(
  record: Record<string, unknown>
): AssetCategory {
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

function formatLookupMetric(
  value: number | null,
  maximumFractionDigits = 2
): string {
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
    status === '승인'
      ? 1
      : status === '조건부 진행'
        ? 0.72
        : status === '보류'
          ? 0.22
          : 0.48;
  const npvKrw = Math.round(profit * statusWeight);
  const baseIrr = investmentKrw > 0 ? profit / investmentKrw : 0;
  const irr = Math.min(
    0.32,
    Math.max(
      0.02,
      Number((0.08 + baseIrr * 0.16 + statusWeight * 0.02).toFixed(3))
    )
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
  selectedProject: ProjectSummary | null;
  selectedDetail: ProjectDetail | null;
  detailStatus: 'idle' | 'loading' | 'ready' | 'error';
  detailError: string | null;
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
  onRetryDetailLoad(): void;
  onRetryPortfolioLoad(): void;
};

export function PortfolioView({
  selectedRole,
  portfolio,
  portfolioStatus,
  portfolioError,
  selectedProject,
  selectedDetail,
  detailStatus,
  detailError,
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
  onRetryDetailLoad,
  onRetryPortfolioLoad
}: PortfolioViewProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>(
    'all'
  );
  const [createdProjects, setCreatedProjects] = useState<ProjectSummary[]>([]);
  const [projectEdits, setProjectEdits] = useState<
    Record<string, ProjectEditDraft>
  >({});
  const [modalProjectCode, setModalProjectCode] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'detail' | 'edit' | 'create'>(
    'detail'
  );
  const [portfolioMode, setPortfolioMode] = useState<'list' | 'detail'>('list');
  const [editReturnMode, setEditReturnMode] = useState<'close' | 'detail'>(
    'close'
  );
  const [editForm, setEditForm] = useState<ProjectEditFormState | null>(null);
  const [createForm, setCreateForm] = useState<ProjectCreateFormState | null>(
    null
  );
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

      if (
        !normalizedHeadquarter ||
        seenHeadquarters.has(normalizedHeadquarter)
      ) {
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
    (selectedProjectCode ? projectsByCode.get(selectedProjectCode) : null) ??
    null;
  const modalProject =
    (modalProjectCode ? projectsByCode.get(modalProjectCode) : null) ?? null;
  const isCreateModalOpen = modalMode === 'create' && createForm !== null;
  const isEditModalOpen =
    modalMode === 'edit' && modalProject !== null && editForm !== null;
  const isModalOpen = isCreateModalOpen || isEditModalOpen;
  const detailProject = explicitSelectedProject ?? selectedProject ?? null;
  const activeDetail =
    selectedProject?.code === detailProject?.code ? selectedDetail : null;
  const detailSummary = detailProject
    ? {
        headquarter: detailProject.headquarter,
        budgetKrw: detailProject.investmentKrw,
        executedKrw:
          activeDetail?.allocation.allocatedCostKrw ??
          Math.round(detailProject.investmentKrw * 0.42),
        periodLabel: activeDetail
          ? `${activeDetail.startDate} · ${activeDetail.lifecycle}`
          : `${detailProject.paybackYears.toFixed(1)}년`
      }
    : null;
  const detailLatestMetrics = activeDetail
    ? [
        {
          label: 'NPV',
          value: formatKrwCompact(activeDetail.valuation.fairValueKrw),
          tone: 'default' as const
        },
        {
          label: 'IRR',
          value: detailProject
            ? `${(detailProject.irr * 100).toFixed(1)}%`
            : '-',
          tone: 'default' as const
        },
        {
          label: 'VaR 95%',
          value: formatKrwCompact(activeDetail.valuation.var95Krw),
          tone: 'danger' as const
        },
        {
          label: '신용등급',
          value: activeDetail.valuation.creditGrade,
          tone: 'accent' as const
        }
      ]
    : detailProject
      ? [
          {
            label: 'NPV',
            value: formatKrwCompact(detailProject.npvKrw)
          },
          {
            label: 'IRR',
            value: `${(detailProject.irr * 100).toFixed(1)}%`
          },
          {
            label: '회수기간',
            value: `${detailProject.paybackYears.toFixed(1)}년`
          },
          {
            label: '상태',
            value: detailProject.status
          }
        ]
      : [];
  const detailCashFlowRows = useMemo(() => {
    if (!activeDetail) {
      return [];
    }

    let cumulative = 0;
    return activeDetail.cashFlows.map((row) => {
      cumulative += row.amount;
      return {
        period: row.periodLabel,
        cashFlowKrw: row.amount,
        cumulativeKrw: cumulative,
        note: row.note
      };
    });
  }, [activeDetail]);
  const detailCostRows = useMemo(() => {
    if (!activeDetail || !detailProject) {
      return [];
    }

    return activeDetail.costEntries.map((row) => ({
      date: row.date,
      period: row.period,
      department: detailProject.headquarter,
      projectName: detailProject.name,
      costItem: row.costItem,
      actualKrw: row.actual,
      standardKrw: row.standard,
      note: row.note
    }));
  }, [activeDetail, detailProject]);
  const detailValuationRows = useMemo(() => {
    if (!activeDetail) {
      return [];
    }

    return activeDetail.valuationHistory.map((row) => ({
      valuationDate: row.evaluatedAt,
      valuationType: row.type,
      npvKrw: row.npvKrw,
      irr: row.irr,
      roi: null,
      fairValueKrw: row.fairValueKrw,
      duration: activeDetail.valuation.duration,
      var95Krw: row.var95Krw,
      grade: row.creditGrade
    }));
  }, [activeDetail]);

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
  }, [headquarterFilter, onChangeHeadquarterFilter, resolvedHeadquarterFilter]);

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

      const focusableElements =
        modalCardRef.current?.querySelectorAll<HTMLElement>(
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

  function openProjectModal(project: ProjectSummary) {
    onSelectProject(project.code);
    setPortfolioMode('detail');
    setModalMode('detail');
    setEditReturnMode('close');
    setEditForm(null);
    setCreateForm(null);
    setCreateFormError(null);
    setProjectLookup(createProjectLookupState());
    setModalProjectCode(null);
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

  function handleExportCsv() {
    if (displayedProjects.length === 0) {
      return;
    }

    const headers = [
      '코드',
      '프로젝트명',
      '본부',
      '상태',
      '유형',
      '리스크',
      '투자액',
      '예상매출',
      'NPV',
      'IRR',
      '회수기간(년)'
    ];
    const escapeCsvCell = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = displayedProjects.map((project) => [
      project.code,
      project.name,
      project.headquarter,
      project.status,
      project.assetCategory,
      project.risk,
      project.investmentKrw,
      project.expectedRevenueKrw,
      project.npvKrw,
      (project.irr * 100).toFixed(2),
      project.paybackYears.toFixed(1)
    ]);
    const csvText = [headers, ...rows]
      .map((cells) => cells.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvText}`], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `costwise-projects-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
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

  function handleBackToList() {
    setPortfolioMode('list');
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
    onSelectProject(code);
    setPortfolioMode('detail');
    setModalProjectCode(null);
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

  function handleModalSurfaceKeydown(
    event: ReactKeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      handleModalClose();
    }
  }

  const actionButtonBaseClass =
    'inline-flex h-10 items-center justify-center rounded-lg border px-3.5 text-sm font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45';
  const secondaryActionButtonClass = `${actionButtonBaseClass} border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50`;
  const primaryActionButtonClass = `${actionButtonBaseClass} border-blue-700 bg-blue-700 text-white shadow-sm hover:bg-blue-600`;
  const controlSurfaceClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200';
  const stateBoxClass =
    'grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4';
  const stateButtonClass =
    'inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100';
  const statusPillBaseClass =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none';
  const filterGroupClass =
    'grid gap-2 rounded-xl border border-slate-200 bg-white/90 p-3';
  const filterPillBaseClass =
    'inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition';
  const projectFormClass = 'mt-4 grid gap-4';
  const projectFormGridClass = 'grid gap-3 sm:grid-cols-2';
  const projectFormFieldClass =
    'grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3';
  const projectFormFieldWideClass = `${projectFormFieldClass} sm:col-span-2`;
  const projectFormFieldLabelClass =
    'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
  const projectFormActionsClass =
    'flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between';
  const projectFormHintClass = 'm-0 text-sm leading-6 text-slate-600';

  function statusPillClass(status: ProjectStatus) {
    if (status === '승인') {
      return `${statusPillBaseClass} border-emerald-200 bg-emerald-50 text-emerald-700`;
    }
    if (status === '조건부 진행') {
      return `${statusPillBaseClass} border-amber-200 bg-amber-50 text-amber-700`;
    }
    if (status === '보류') {
      return `${statusPillBaseClass} border-rose-200 bg-rose-50 text-rose-700`;
    }
    return `${statusPillBaseClass} border-blue-200 bg-blue-50 text-blue-700`;
  }

  function riskPillClass(risk: ProjectSummary['risk']) {
    if (risk === '높음') {
      return `${statusPillBaseClass} border-rose-200 bg-rose-50 text-rose-700`;
    }
    if (risk === '중간') {
      return `${statusPillBaseClass} border-amber-200 bg-amber-50 text-amber-700`;
    }
    return `${statusPillBaseClass} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  return (
    <section className="grid gap-4">
      {portfolioMode === 'list' ? (
        <Panel title="프로젝트" subtitle="20여개 프로젝트 동시 평가·관리">
          {portfolioStatus === 'loading' && !hasHeadquarters ? (
            <div className={stateBoxClass} role="status">
              <strong>포트폴리오 본부 현황을 불러오는 중입니다.</strong>
              <p>API 응답을 기다리고 있습니다.</p>
            </div>
          ) : null}
          {portfolioStatus === 'error' && !hasHeadquarters ? (
            <div className={stateBoxClass}>
              <strong>포트폴리오 본부 현황을 불러오지 못했습니다.</strong>
              <p className="m-0 text-sm text-slate-600">
                {portfolioError ?? 'API 연결 상태를 확인한 뒤 다시 시도하세요.'}
              </p>
              <button
                type="button"
                className={stateButtonClass}
                onClick={onRetryPortfolioLoad}
              >
                다시 시도
              </button>
            </div>
          ) : null}
          {hasHeadquarters ? (
            <>
              <div
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="포트폴리오 개요"
              >
                <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-xs text-slate-500">총 투자액</span>
                  <strong>
                    {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
                  </strong>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-xs text-slate-500">평균 NPV</span>
                  <strong>
                    {formatKrwCompact(portfolio.overview.averageNpvKrw)}
                  </strong>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-xs text-slate-500">조건부 진행</span>
                  <strong>{portfolio.overview.conditionalCount}개</strong>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-xs text-slate-500">승인 완료</span>
                  <strong>{portfolio.overview.approvedCount}개</strong>
                </article>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {portfolio.headquarters.map((headquarter) => (
                  <article
                    key={headquarter.code}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>{headquarter.name}</strong>
                        <span className="mt-1 block text-sm text-slate-500">
                          {headquarter.projectCount}개 프로젝트
                        </span>
                      </div>
                      <span className={riskPillClass(headquarter.risk)}>
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
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-500">
                          총 투자액
                        </span>
                        <strong>
                          {formatKrwCompact(headquarter.totalInvestmentKrw)}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-500">평균 NPV</span>
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
      ) : null}

      {portfolioMode === 'detail' ? (
        <Panel
          title={detailProject ? detailProject.name : '프로젝트 상세'}
          subtitle=""
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className={secondaryActionButtonClass}
                onClick={handleBackToList}
              >
                목록으로
              </button>
              {detailProject ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {detailProject.code} · {detailProject.headquarter}
                </span>
              ) : null}
            </div>
            {detailProject ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {detailProject.code}
                  </span>
                  <span className={statusPillClass(detailProject.status)}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                    {detailProject.status}
                  </span>
                  <span className={riskPillClass(detailProject.risk)}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                    {detailProject.risk}
                  </span>
                </div>
                <button type="button" className={secondaryActionButtonClass}>
                  평가 계산
                </button>
              </div>
            ) : null}

            {detailStatus === 'loading' ? (
              <div className={stateBoxClass} role="status">
                <strong>프로젝트 상세 데이터를 불러오는 중입니다.</strong>
                <p>현금흐름/원가/평가 이력을 준비하고 있습니다.</p>
              </div>
            ) : null}

            {detailStatus === 'error' ? (
              <div className={stateBoxClass}>
                <strong>프로젝트 상세를 불러오지 못했습니다.</strong>
                <p className="m-0 text-sm text-slate-600">
                  {detailError ?? '잠시 후 다시 시도하세요.'}
                </p>
                <button
                  type="button"
                  className={stateButtonClass}
                  onClick={onRetryDetailLoad}
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            <ProjectDetailSection
              summary={detailSummary}
              latestMetrics={detailLatestMetrics}
              cashFlowRows={detailCashFlowRows}
              costRows={detailCostRows}
              valuationRows={detailValuationRows}
              emptyMessage={
                detailProject
                  ? '선택한 프로젝트의 상세 데이터가 아직 없습니다.'
                  : '프로젝트를 선택하면 상세 정보를 확인할 수 있습니다.'
              }
            />
          </div>
        </Panel>
      ) : (
        <Panel
          title="프로젝트 목록"
          subtitle="필터/검색 후 상세 분석으로 진입합니다."
        >
          {isErrorWithoutData ? (
            <div className={stateBoxClass}>
              <strong>프로젝트 목록을 불러오지 못했습니다.</strong>
              <p className="m-0 text-sm text-slate-600">
                {portfolioError ?? '잠시 후 다시 시도하세요.'}
              </p>
              <button
                type="button"
                className={stateButtonClass}
                onClick={onRetryPortfolioLoad}
              >
                다시 시도
              </button>
            </div>
          ) : null}

          {isLoadingWithoutData ? (
            <div className={stateBoxClass} role="status">
              <strong>프로젝트 목록을 불러오는 중입니다.</strong>
              <p>필터와 테이블은 데이터 수신 후 활성화됩니다.</p>
            </div>
          ) : null}

          {!isErrorWithoutData && !isLoadingWithoutData ? (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/65 to-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 border-b border-slate-200 pb-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    프로젝트 운영 센터
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                    프로젝트 목록
                  </h3>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    검색과 다중 필터로 운영 후보를 좁힌 뒤, 상세 허브에서
                    컨텍스트를 정리하고 분석 워크스페이스로 이동합니다.
                  </p>
                </div>
                <div
                  className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:grid-cols-2 xl:w-[26.5rem]"
                  aria-label="운영 액션"
                >
                  <button
                    type="button"
                    className={primaryActionButtonClass}
                    onClick={() => {
                      if (explicitSelectedProject) {
                        openProjectModal(explicitSelectedProject);
                      }
                    }}
                    disabled={!explicitSelectedProject}
                  >
                    상세 허브
                  </button>
                  {isProjectWritable ? (
                    <button
                      type="button"
                      className={primaryActionButtonClass}
                      onClick={(event: ReactMouseEvent<HTMLButtonElement>) =>
                        openProjectCreateModal(event.currentTarget)
                      }
                    >
                      + 새 프로젝트
                    </button>
                  ) : (
                    <span className="col-span-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      {writeAccessMessage}
                    </span>
                  )}
                  {isProjectWritable ? (
                    <button
                      type="button"
                      className={secondaryActionButtonClass}
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
                  {isProjectWritable ? (
                    <button
                      type="button"
                      className={secondaryActionButtonClass}
                      onClick={handleExportCsv}
                      disabled={displayedProjects.length === 0}
                    >
                      CSV 내보내기
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                className="mt-4 grid gap-3 xl:grid-cols-12"
                aria-label="프로젝트 운영 필터"
              >
                <div className={`${filterGroupClass} xl:col-span-4`}>
                  <label
                    className="flex min-w-0 flex-col gap-1.5"
                    htmlFor="project-search-input"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                      검색
                    </span>
                    <input
                      id="project-search-input"
                      type="search"
                      value={searchTerm}
                      placeholder="프로젝트명, 코드, 본부 검색"
                      onChange={(event) =>
                        onChangeSearchTerm(event.target.value)
                      }
                      className={controlSurfaceClass}
                    />
                  </label>
                  <label
                    className="flex min-w-0 flex-col gap-1.5"
                    htmlFor="project-sort-select"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                      정렬
                    </span>
                    <select
                      id="project-sort-select"
                      value={explorerSort}
                      onChange={(event) =>
                        onChangeSort(event.target.value as ExplorerSortKey)
                      }
                      className={controlSurfaceClass}
                    >
                      {explorerSortOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  className={`${filterGroupClass} xl:col-span-3`}
                  aria-label="빠른 필터"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                      빠른 필터
                    </span>
                    <span className="text-xs text-slate-500">
                      {explorerQuickFilterOptions.length}개
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {explorerQuickFilterOptions.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        className={`${filterPillBaseClass} ${
                          explorerQuickFilter === filter.key
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                        aria-pressed={explorerQuickFilter === filter.key}
                        onClick={() => onChangeQuickFilter(filter.key)}
                        title={filter.helper}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`${filterGroupClass} xl:col-span-2`}
                  aria-label="상태 필터"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                      상태
                    </span>
                    <span className="text-xs text-slate-500">
                      {statusFilter === 'all' ? '전체' : statusFilter}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {projectStatusFilterOptions.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        className={`${filterPillBaseClass} ${
                          statusFilter === filter.key
                            ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                        }`}
                        aria-pressed={statusFilter === filter.key}
                        onClick={() => setStatusFilter(filter.key)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`${filterGroupClass} xl:col-span-3`}
                  aria-label="본부 필터"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
                      본부
                    </span>
                    <span className="text-xs text-slate-500">
                      {resolvedHeadquarterFilter === 'all'
                        ? '전체'
                        : resolvedHeadquarterFilter}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderedHeadquarterOptions.map((headquarter) => (
                      <button
                        key={headquarter}
                        type="button"
                        className={`${filterPillBaseClass} ${
                          resolvedHeadquarterFilter === headquarter
                            ? 'border-indigo-700 bg-indigo-700 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                        }`}
                        aria-pressed={resolvedHeadquarterFilter === headquarter}
                        onClick={() => onChangeHeadquarterFilter(headquarter)}
                      >
                        {headquarter === 'all' ? '전체 본부' : headquarter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center">
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  운영 대상 {displayedProjects.length}
                </span>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  필터 결과 {recomputedFilteredProjects.length}
                </span>
                <span className="text-sm text-slate-600">
                  전체 프로젝트 <strong>{mergedProjects.length}</strong>
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {explicitSelectedProject ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      현재 선택 {explicitSelectedProject.name}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      선택된 프로젝트 없음
                    </span>
                  )}
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    onClick={resetOperationalFilters}
                  >
                    필터 초기화
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1000px] w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-[1] bg-slate-100/95 backdrop-blur">
                      <tr>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          우선
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          프로젝트
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          본부
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          상태
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          리스크
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          투자액
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          NPV
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          IRR
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          회수
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          허브
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProjects.map((project) => (
                        <tr
                          key={project.code}
                          className={`cursor-pointer border-t border-slate-200 align-top transition odd:bg-white even:bg-slate-50/40 hover:bg-cyan-50/70 ${
                            project.code === selectedProjectCode
                              ? 'bg-emerald-50/80'
                              : ''
                          } ${
                            project.code === modalProjectCode
                              ? 'bg-indigo-50/80'
                              : ''
                          }`}
                          tabIndex={0}
                          onClick={() => openProjectModal(project)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openProjectModal(project);
                            }
                          }}
                        >
                          <td className="whitespace-nowrap px-3 py-2">
                            <span className="inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              #{project.rank}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <strong className="font-semibold text-slate-800">
                              {project.name}
                            </strong>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {project.code} · {project.assetCategory}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                            {project.headquarter}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span className={statusPillClass(project.status)}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                              {project.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span className={riskPillClass(project.risk)}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
                              {project.risk}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                            {formatKrwCompact(project.investmentKrw)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                            {formatKrwCompact(project.npvKrw)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                            {(project.irr * 100).toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                            {project.paybackYears.toFixed(1)}년
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                              aria-label={`${project.name} 상세 허브 열기`}
                              onClick={(
                                event: ReactMouseEvent<HTMLButtonElement>
                              ) => {
                                event.stopPropagation();
                                openProjectModal(project);
                              }}
                            >
                              상세 허브
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {displayedProjects.length === 0 ? (
                  <div className="m-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="m-0 text-sm text-slate-600">
                      조건에 맞는 프로젝트가 없습니다.
                    </p>
                    <button
                      type="button"
                      className={stateButtonClass}
                      onClick={resetOperationalFilters}
                    >
                      탐색 조건 초기화
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </Panel>
      )}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
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
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
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
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      신규 프로젝트
                    </p>
                    <h3
                      id="portfolio-create-modal-title"
                      className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
                    >
                      프로젝트 등록
                    </h3>
                    <p
                      id="portfolio-create-modal-description"
                      className="mt-1 text-sm leading-6 text-slate-600"
                    >
                      프로젝트 기본 정보를 입력하면 로컬 상태에 즉시 추가됩니다.
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    onClick={handleModalClose}
                  >
                    닫기
                  </button>
                </div>

                <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>기본 자산군</small>
                    <strong>{createForm.assetCategory}</strong>
                  </span>
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>현재 선택</small>
                    <strong>
                      {explicitSelectedProject?.name ?? '선택 없음'}
                    </strong>
                  </span>
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>저장 방식</small>
                    <strong>프론트엔드 로컬 상태</strong>
                  </span>
                </div>

                <form
                  className={projectFormClass}
                  onSubmit={handleCreateSubmit}
                >
                  <div className={projectFormFieldWideClass}>
                    <span className={projectFormFieldLabelClass}>
                      외부 종목 조회
                    </span>
                    <input
                      className={controlSurfaceClass}
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
                    <div className={projectFormActionsClass}>
                      <p className={projectFormHintClass}>
                        {projectLookup.status === 'loading'
                          ? 'Yahoo ticker 정보를 조회하는 중입니다.'
                          : (projectLookup.error ??
                            '조회 성공 시 코드, 프로젝트명, 자산군을 자동으로 채웁니다.')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          className={secondaryActionButtonClass}
                          onClick={() => void handleProjectLookup()}
                          disabled={projectLookup.status === 'loading'}
                        >
                          {projectLookup.status === 'loading'
                            ? '조회 중...'
                            : '조회'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {projectLookup.summary ? (
                    <div
                      className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3"
                      aria-label="종목 요약"
                    >
                      <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                        <small>종목</small>
                        <strong>{projectLookup.summary.symbol}</strong>
                      </span>
                      <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                        <small>시장</small>
                        <strong>
                          {projectLookup.summary.exchange ?? '시장 정보 없음'}
                        </strong>
                      </span>
                      <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                        <small>현재가 / 변동</small>
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

                  <div className={projectFormGridClass}>
                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>
                        프로젝트 코드
                      </span>
                      <input
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldWideClass}>
                      <span className={projectFormFieldLabelClass}>
                        프로젝트명
                      </span>
                      <input
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>자산군</span>
                      <select
                        className={controlSurfaceClass}
                        value={createForm.assetCategory}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  assetCategory: event.target
                                    .value as AssetCategory
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>상태</span>
                      <select
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>본부</span>
                      <input
                        className={controlSurfaceClass}
                        list="portfolio-headquarter-options"
                        type="text"
                        value={createForm.headquarter}
                        disabled={Boolean(divisionScope)}
                        onChange={(event) => {
                          setCreateFormError(null);
                          setCreateForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  headquarter: event.target.value
                                }
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>투자액</span>
                      <input
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>
                        예상 매출
                      </span>
                      <input
                        className={controlSurfaceClass}
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

                  <div className={projectFormActionsClass}>
                    <p className={projectFormHintClass}>
                      {createFormError ??
                        (divisionScope
                          ? `등록 본부가 ${divisionScope}로 고정되어 있습니다.`
                          : '등록 후 즉시 테이블과 상세 허브에서 새 프로젝트를 사용할 수 있습니다.')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        className={secondaryActionButtonClass}
                        onClick={handleModalClose}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className={primaryActionButtonClass}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : modalMode === 'edit' && editForm && modalProject ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {modalProject.code}
                    </p>
                    <h3
                      id="portfolio-edit-modal-title"
                      className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
                    >
                      프로젝트 편집
                    </h3>
                    <p
                      id="portfolio-edit-modal-description"
                      className="mt-1 text-sm leading-6 text-slate-600"
                    >
                      프로젝트명, 본부, 상태, 투자액, 예상 매출을 프론트엔드
                      상태에서만 수정합니다.
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    onClick={handleModalClose}
                  >
                    닫기
                  </button>
                </div>

                <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>본부</small>
                    <strong>{modalProject.headquarter}</strong>
                  </span>
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>현재 선택</small>
                    <strong>
                      {explicitSelectedProject?.name ?? '선택 없음'}
                    </strong>
                  </span>
                  <span className="flex flex-col gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <small>편집 대상</small>
                    <strong>{modalProject.code}</strong>
                  </span>
                </div>

                <form className={projectFormClass} onSubmit={handleEditSubmit}>
                  <div className={projectFormGridClass}>
                    <label className={projectFormFieldWideClass}>
                      <span className={projectFormFieldLabelClass}>
                        프로젝트명
                      </span>
                      <input
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>상태</span>
                      <select
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>본부</span>
                      <input
                        className={controlSurfaceClass}
                        list="portfolio-headquarter-options"
                        type="text"
                        value={editForm.headquarter}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? {
                                  ...currentForm,
                                  headquarter: event.target.value
                                }
                              : currentForm
                          )
                        }
                        required
                      />
                    </label>

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>투자액</span>
                      <input
                        className={controlSurfaceClass}
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

                    <label className={projectFormFieldClass}>
                      <span className={projectFormFieldLabelClass}>
                        예상 매출
                      </span>
                      <input
                        className={controlSurfaceClass}
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

                  <div className={projectFormActionsClass}>
                    <p className={projectFormHintClass}>
                      저장 즉시 운영 테이블, 본부 필터, 상세 허브 값이
                      갱신됩니다.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        className={secondaryActionButtonClass}
                        onClick={handleEditCancel}
                      >
                        {editReturnMode === 'detail'
                          ? '상세 허브로 돌아가기'
                          : '취소'}
                      </button>
                      <button
                        type="submit"
                        className={primaryActionButtonClass}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
