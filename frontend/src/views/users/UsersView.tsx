import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatDateTime } from '../../app/format';
import {
  createUserAccount,
  deleteUserAccount,
  isForbiddenApiError,
  loadAuditEventsByProjectId,
  loadUsers,
  updateUserAccount,
  type AuditEvent,
  type Role,
  type UpsertUserRequest,
  type UserAccount
} from '../../app/portfolioData';
import { canManageUsers } from '../../features/auth/permissions';
import { Panel } from '../../shared/components/Panel';
import {
  controlSurfaceClass,
  formActionsClass,
  formClass,
  formFieldClass,
  formFieldLabelClass,
  formFieldWideClass,
  formGridClass,
  primaryActionButtonClass,
  secondaryActionButtonClass,
  stateBoxClass,
  tonePillClass
} from './usersView.styles';

const defaultFormState: UpsertUserRequest = {
  email: '',
  displayName: '',
  role: 'PM',
  division: '',
  status: 'ACTIVE',
  mfaEnabled: false
};

const formRoleOptions = [
  'ADMIN',
  'EXECUTIVE',
  'PM',
  'ACCOUNTANT',
  'AUDITOR'
] as const;
const formStatusOptions = ['ACTIVE', 'SUSPENDED', 'INVITED'] as const;

type UsersViewProps = {
  selectedRole: Role;
  divisionScope: string | null;
  divisionOptions: string[];
};

export function UsersView({
  selectedRole,
  divisionScope,
  divisionOptions
}: UsersViewProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [usersStatus, setUsersStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersReloadKey, setUsersReloadKey] = useState(0);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditStatus, setAuditStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formState, setFormState] =
    useState<UpsertUserRequest>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManage = canManageUsers(selectedRole);
  const isModalOpen = modalMode !== null;

  useEffect(() => {
    let cancelled = false;
    setUsersStatus('loading');
    setUsersError(null);

    void loadUsers()
      .then((loadedUsers) => {
        if (!cancelled) {
          setUsers(loadedUsers);
          setUsersStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setUsers([]);
          setUsersStatus('error');
          setUsersError(
            isForbiddenApiError(error)
              ? '사용자 조회 권한이 없습니다(403). 관리자에게 권한을 요청하세요.'
              : error instanceof Error
                ? error.message
                : '사용자 목록을 불러오지 못했습니다.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [usersReloadKey]);

  useEffect(() => {
    let cancelled = false;
    setAuditStatus('loading');
    setAuditError(null);

    void loadAuditEventsByProjectId('USER-MGMT', 20)
      .then(({ events }) => {
        if (!cancelled) {
          setAuditEvents(events);
          setAuditStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAuditEvents([]);
          setAuditStatus('error');
          setAuditError(
            isForbiddenApiError(error)
              ? '사용자 감사 로그 조회 권한이 없습니다(403).'
              : error instanceof Error
                ? error.message
                : '감사 로그를 불러오지 못했습니다.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auditReloadKey]);

  const visibleUsers = useMemo(
    () =>
      divisionScope
        ? users.filter((user) => user.division === divisionScope)
        : users,
    [divisionScope, users]
  );

  function openCreateModal() {
    setEditingUser(null);
    setModalMode('create');
    setSubmitError(null);
    setFormState({
      ...defaultFormState,
      division: divisionScope ?? divisionOptions[0] ?? ''
    });
  }

  function openEditModal(user: UserAccount) {
    setEditingUser(user);
    setModalMode('edit');
    setSubmitError(null);
    setFormState({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      division: user.division,
      status: user.status,
      mfaEnabled: user.mfaEnabled
    });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    setModalMode(null);
    setEditingUser(null);
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: UpsertUserRequest = {
        ...formState,
        email: formState.email.trim().toLowerCase(),
        displayName: formState.displayName.trim(),
        division: formState.division.trim(),
        status: formState.status.trim(),
        role: formState.role.trim().toUpperCase()
      };

      if (modalMode === 'edit' && editingUser) {
        await updateUserAccount(editingUser.id, payload);
      } else {
        await createUserAccount(payload);
      }

      setModalMode(null);
      setEditingUser(null);
      setUsersReloadKey((current) => current + 1);
      setAuditReloadKey((current) => current + 1);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '저장에 실패했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: UserAccount) {
    if (!canManage) {
      return;
    }
    const accepted = window.confirm(
      `${user.displayName} 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );
    if (!accepted) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteUserAccount(user.id);
      setUsersReloadKey((current) => current + 1);
      setAuditReloadKey((current) => current + 1);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.'
      );
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel
        title="User directory"
        subtitle="역할/본부/상태 기준으로 계정을 운영하고 변경 내역을 감사 로그와 연결합니다."
      >
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5"
          aria-live="polite"
        >
          <span className={tonePillClass(canManage ? 'active' : 'mid')}>
            {canManage ? '관리 권한' : '읽기 권한'}
          </span>
          <p className="text-sm leading-5 text-cw-muted">
            {divisionScope
              ? `본부 스코프(${divisionScope})에 맞는 사용자만 표시합니다.`
              : '전체 본부 사용자를 표시합니다.'}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          {canManage ? (
            <button
              type="button"
              className={primaryActionButtonClass}
              onClick={openCreateModal}
            >
              사용자 등록
            </button>
          ) : null}
          <button
            type="button"
            className={secondaryActionButtonClass}
            onClick={() => setUsersReloadKey((current) => current + 1)}
          >
            목록 새로고침
          </button>
          <button
            type="button"
            className={secondaryActionButtonClass}
            onClick={() => setAuditReloadKey((current) => current + 1)}
          >
            감사 로그 새로고침
          </button>
        </div>

        {usersStatus === 'loading' ? (
          <div className={stateBoxClass} role="status">
            <strong>사용자 목록을 불러오는 중입니다.</strong>
            <p>권한과 본부 스코프를 확인하고 있습니다.</p>
          </div>
        ) : null}

        {usersStatus === 'error' ? (
          <div className={stateBoxClass}>
            <strong>사용자 목록을 불러오지 못했습니다.</strong>
            <p className="m-0 text-sm text-slate-600">
              {usersError ?? '잠시 후 다시 시도하세요.'}
            </p>
          </div>
        ) : null}

        {usersStatus === 'ready' ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] table-auto border-collapse">
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      사용자
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      역할
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      본부
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      상태
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      MFA
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      업데이트
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-500"
                      scope="col"
                    >
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-200 align-top hover:bg-slate-50"
                    >
                      <td className="px-3 py-2.5">
                        <strong>{user.displayName}</strong>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {user.role}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {user.division}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={tonePillClass(statusTone(user.status))}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {formatUserTimestamp(user.updatedAt ?? user.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={secondaryActionButtonClass}
                            onClick={() => openEditModal(user)}
                            disabled={!canManage}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={`${secondaryActionButtonClass} border-rose-300 text-rose-700 hover:bg-rose-50`}
                            onClick={() => handleDelete(user)}
                            disabled={!canManage}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleUsers.length === 0 ? (
              <div className="m-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <strong>표시할 사용자가 없습니다.</strong>
                <p className="m-0 text-sm text-slate-600">
                  본부 스코프 또는 필터 조건을 확인하세요.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {deleteError ? (
          <p className="mt-2 text-xs text-rose-700" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Panel>

      <Panel
        title="User management audit"
        subtitle="사용자 생성/수정/삭제는 USER-MGMT 도메인 감사 로그에 기록됩니다."
      >
        {auditStatus === 'loading' ? (
          <div className={stateBoxClass} role="status">
            <strong>감사 로그를 불러오는 중입니다.</strong>
            <p>최근 20건의 사용자 관리 이벤트를 조회하고 있습니다.</p>
          </div>
        ) : null}

        {auditStatus === 'error' ? (
          <div className={stateBoxClass}>
            <strong>감사 로그를 불러오지 못했습니다.</strong>
            <p className="m-0 text-sm text-slate-600">
              {auditError ?? '잠시 후 다시 시도하세요.'}
            </p>
          </div>
        ) : null}

        {auditStatus === 'ready' && auditEvents.length === 0 ? (
          <div className={stateBoxClass}>
            <strong>아직 기록된 사용자 감사 로그가 없습니다.</strong>
            <p className="m-0 text-sm text-slate-600">
              사용자 CRUD 작업을 수행하면 이력에 누적됩니다.
            </p>
          </div>
        ) : null}

        {auditStatus === 'ready' && auditEvents.length > 0 ? (
          <ol className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {auditEvents.map((event) => (
              <li
                key={`${event.actor}-${event.action}-${event.at}`}
                className="grid gap-1 border-b border-slate-200 px-3 py-2.5 text-sm last:border-b-0"
              >
                <strong className="font-semibold text-[#142542]">
                  {event.actor}
                </strong>
                <span className="text-cw-muted">{event.action}</span>
                <small className="text-xs text-cw-muted">
                  {event.domain} · {formatDateTime(event.at)}
                </small>
              </li>
            ))}
          </ol>
        ) : null}
      </Panel>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label="사용자 편집 닫기"
            onClick={closeModal}
          />
          <section
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              modalMode === 'create' ? 'users-create-title' : 'users-edit-title'
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {modalMode === 'create' ? 'New user' : editingUser?.email}
                </p>
                <h3
                  id={
                    modalMode === 'create'
                      ? 'users-create-title'
                      : 'users-edit-title'
                  }
                  className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
                >
                  {modalMode === 'create' ? '사용자 등록' : '사용자 수정'}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  권한/본부/상태를 설정하면 USER-MGMT 감사 로그에 자동
                  기록됩니다.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                aria-label="모달 닫기"
                onClick={closeModal}
              >
                닫기
              </button>
            </div>

            <form className={formClass} onSubmit={handleSubmit}>
              <div className={formGridClass}>
                <label className={formFieldWideClass}>
                  <span className={formFieldLabelClass}>이메일</span>
                  <input
                    className={controlSurfaceClass}
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        email: event.target.value
                      }))
                    }
                    required
                  />
                </label>

                <label className={formFieldClass}>
                  <span className={formFieldLabelClass}>이름</span>
                  <input
                    className={controlSurfaceClass}
                    type="text"
                    value={formState.displayName}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        displayName: event.target.value
                      }))
                    }
                    required
                  />
                </label>

                <label className={formFieldClass}>
                  <span className={formFieldLabelClass}>역할</span>
                  <select
                    className={controlSurfaceClass}
                    value={formState.role}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        role: event.target.value
                      }))
                    }
                    required
                  >
                    {formRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={formFieldClass}>
                  <span className={formFieldLabelClass}>본부</span>
                  <input
                    className={controlSurfaceClass}
                    type="text"
                    list="users-division-options"
                    value={formState.division}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        division: event.target.value
                      }))
                    }
                    required
                  />
                  <datalist id="users-division-options">
                    {divisionOptions.map((division) => (
                      <option key={division} value={division} />
                    ))}
                  </datalist>
                </label>

                <label className={formFieldClass}>
                  <span className={formFieldLabelClass}>상태</span>
                  <select
                    className={controlSurfaceClass}
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value
                      }))
                    }
                    required
                  >
                    {formStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={formFieldClass}>
                  <span className={formFieldLabelClass}>MFA</span>
                  <select
                    className={controlSurfaceClass}
                    value={formState.mfaEnabled ? 'enabled' : 'disabled'}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        mfaEnabled: event.target.value === 'enabled'
                      }))
                    }
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <div className={formActionsClass}>
                <p
                  className="m-0 text-sm leading-6 text-slate-600"
                  role="alert"
                >
                  {submitError ?? '필수 입력값을 확인한 뒤 저장하세요.'}
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className={secondaryActionButtonClass}
                    onClick={closeModal}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={primaryActionButtonClass}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? '저장 중...'
                      : modalMode === 'create'
                        ? '사용자 생성'
                        : '사용자 저장'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function statusTone(status: string): 'active' | 'low' | 'mid' | 'high' {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'low';
  }
  if (normalized === 'INVITED' || normalized === 'PENDING') {
    return 'mid';
  }
  if (normalized === 'SUSPENDED' || normalized === 'DISABLED') {
    return 'high';
  }
  return 'active';
}

function formatUserTimestamp(iso?: string) {
  if (!iso) {
    return '-';
  }

  return formatDateTime(iso);
}
