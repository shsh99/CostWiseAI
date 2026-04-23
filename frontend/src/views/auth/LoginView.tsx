/* eslint-disable no-unused-vars */
import { useState, type FormEvent } from 'react';

type LoginViewProps = {
  onLogin(username: string, password: string): boolean;
};

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = onLogin(username.trim(), password);
    if (!succeeded) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    setError(null);
  }

  return (
    <div className="auth-screen">
      <section className="auth-card" aria-label="로그인">
        <header className="auth-card__header">
          <div className="auth-brand">
            <div className="auth-brand__icon">CW</div>
            <div>
              <strong>CostWise</strong>
              <p>원가·평가 통합관리 플랫폼</p>
            </div>
          </div>
          <p>프로젝트 원가관리와 금융상품 가치평가를 하나의 운영 흐름으로 관리합니다.</p>
        </header>

        <form className="auth-card__body" onSubmit={handleSubmit}>
          <label>
            <span>아이디</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">로그인</button>
          {error ? (
            <p className="auth-card__error" role="alert">
              {error}
            </p>
          ) : null}

          <section className="auth-demo">
            <strong>테스트 계정</strong>
            <p>CostWise 관리자: admin / admin123</p>
            <p>본부장/임원: cfo / user123</p>
            <p>원가 담당: analyst / user123</p>
            <p>감사/열람: viewer / user123</p>
          </section>
        </form>
      </section>
    </div>
  );
}
