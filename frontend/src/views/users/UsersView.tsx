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

const defaultFormState: UpsertUserRequest = {
  email: '',
  displayName: '',
  role: 'PM',
  division: '',
  status: 'ACTIVE',
  mfaEnabled: false
};

const formRoleOptions = ['ADMIN', 'EXECUTIVE', 'PM', 'ACCOUNTANT', 'AUDITOR'] as const;
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
  const [usersStatus, setUsersStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersReloadKey, setUsersReloadKey] = useState(0);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditStatus, setAuditStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formState, setFormState] = useState<UpsertUserRequest>(defaultFormState);
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
      setSubmitError(error instanceof Error ? error.message : '저장에 실패했습니다.');
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
    <section className="reviews-grid">
      <Panel
        title="User directory"
        subtitle="역할/본부/상태 기준으로 계정을 운영하고 변경 내역을 감사 로그와 연결합니다."
      >
        <div className="audit-status" aria-live="polite">
          <span className={`status-pill status-pill--${canManage ? 'active' : 'mid'}`}>
            {canManage ? '관리 권한' : '읽기 권한'}
          </span>
          <p>
            {divisionScope
              ? `본부 스코프(${divisionScope})에 맞는 사용자만 표시합니다.`
              : '전체 본부 사용자를 표시합니다.'}
          </p>
        </div>

        <div className="table-actions">
          {canManage ? (
            <button type="button" onClick={openCreateModal}>
              사용자 등록
            </button>
          ) : null}
          <button type="button" onClick={() => setUsersReloadKey((current) => current + 1)}>
            목록 새로고침
          </button>
          <button type="button" onClick={() => setAuditReloadKey((current) => current + 1)}>
            감사 로그 새로고침
          </button>
        </div>

        {usersStatus === 'loading' ? (
          <div className="audit-state" role="status">
            <strong>사용자 목록을 불러오는 중입니다.</strong>
            <p>권한과 본부 스코프를 확인하고 있습니다.</p>
          </div>
        ) : null}

        {usersStatus === 'error' ? (
          <div className="empty-state">
            <strong>사용자 목록을 불러오지 못했습니다.</strong>
            <p>{usersError ?? '잠시 후 다시 시도하세요.'}</p>
          </div>
        ) : null}

        {usersStatus === 'ready' ? (
          <div className="table-shell table-shell--operations">
            <table className="data-table data-table--operations">
              <thead>
                <tr>
                  <th scope="col">사용자</th>
                  <th scope="col">역할</th>
                  <th scope="col">본부</th>
                  <th scope="col">상태</th>
                  <th scope="col">MFA</th>
                  <th scope="col">업데이트</th>
                  <th scope="col">작업</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.displayName}</strong>
                      <p className="table-subtle">{user.email}</p>
                    </td>
                    <td>{user.role}</td>
                    <td>{user.division}</td>
                    <td>
                      <span className={`status-pill status-pill--${statusTone(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.mfaEnabled ? 'Enabled' : 'Disabled'}</td>
                    <td>{formatUserTimestamp(user.updatedAt ?? user.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          disabled={!canManage}
                        >
                          수정
                        </button>
                        <button
                          type="button"
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

            {visibleUsers.length === 0 ? (
              <div className="empty-state">
                <strong>표시할 사용자가 없습니다.</strong>
                <p>본부 스코프 또는 필터 조건을 확인하세요.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {deleteError ? (
          <p className="table-subtle" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Panel>

      <Panel
        title="User management audit"
        subtitle="사용자 생성/수정/삭제는 USER-MGMT 도메인 감사 로그에 기록됩니다."
      >
        {auditStatus === 'loading' ? (
          <div className="audit-state" role="status">
            <strong>감사 로그를 불러오는 중입니다.</strong>
            <p>최근 20건의 사용자 관리 이벤트를 조회하고 있습니다.</p>
          </div>
        ) : null}

        {auditStatus === 'error' ? (
          <div className="empty-state">
            <strong>감사 로그를 불러오지 못했습니다.</strong>
            <p>{auditError ?? '잠시 후 다시 시도하세요.'}</p>
          </div>
        ) : null}

        {auditStatus === 'ready' && auditEvents.length === 0 ? (
          <div className="empty-state">
            <strong>아직 기록된 사용자 감사 로그가 없습니다.</strong>
            <p>사용자 CRUD 작업을 수행하면 이력에 누적됩니다.</p>
          </div>
        ) : null}

        {auditStatus === 'ready' && auditEvents.length > 0 ? (
          <ol className="audit-list audit-list--wide">
            {auditEvents.map((event) => (
              <li key={`${event.actor}-${event.action}-${event.at}`}>
                <strong>{event.actor}</strong>
                <span>{event.action}</span>
                <small>
                  {event.domain} · {formatDateTime(event.at)}
                </small>
              </li>
            ))}
          </ol>
        ) : null}
      </Panel>

      {isModalOpen ? (
        <div className="portfolio-modal" role="presentation">
          <button
            type="button"
            className="portfolio-modal__backdrop"
            aria-label="사용자 편집 닫기"
            onClick={closeModal}
          />
          <section
            className="portfolio-modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalMode === 'create' ? 'users-create-title' : 'users-edit-title'}
          >
            <div className="portfolio-modal__header">
              <div>
                <p className="portfolio-modal__eyebrow">
                  {modalMode === 'create' ? 'New user' : editingUser?.email}
                </p>
                <h3 id={modalMode === 'create' ? 'users-create-title' : 'users-edit-title'}>
                  {modalMode === 'create' ? '사용자 등록' : '사용자 수정'}
                </h3>
                <p>권한/본부/상태를 설정하면 USER-MGMT 감사 로그에 자동 기록됩니다.</p>
              </div>
              <button
                type="button"
                className="portfolio-modal__close"
                aria-label="모달 닫기"
                onClick={closeModal}
              >
                닫기
              </button>
            </div>

            <form className="portfolio-edit-form" onSubmit={handleSubmit}>
              <div className="portfolio-edit-form__grid">
                <label className="portfolio-edit-form__field portfolio-edit-form__field--wide">
                  <span>이메일</span>
                  <input
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

                <label className="portfolio-edit-form__field">
                  <span>이름</span>
                  <input
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

                <label className="portfolio-edit-form__field">
                  <span>역할</span>
                  <select
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

                <label className="portfolio-edit-form__field">
                  <span>본부</span>
                  <input
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

                <label className="portfolio-edit-form__field">
                  <span>상태</span>
                  <select
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

                <label className="portfolio-edit-form__field">
                  <span>MFA</span>
                  <select
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

              <div className="portfolio-edit-form__actions">
                <p className="portfolio-edit-form__hint" role="alert">
                  {submitError ?? '필수 입력값을 확인한 뒤 저장하세요.'}
                </p>
                <div className="portfolio-edit-form__action-group">
                  <button
                    type="button"
                    className="portfolio-action portfolio-action--secondary"
                    onClick={closeModal}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="portfolio-action portfolio-action--primary"
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
