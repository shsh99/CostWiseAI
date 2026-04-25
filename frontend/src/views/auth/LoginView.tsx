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
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#142b78_0%,#1f347f_45%,#17a5d6_100%)] p-5">
      <section
        className="w-full max-w-[560px] overflow-hidden rounded-[20px] shadow-[0_24px_56px_rgba(10,20,56,0.35)]"
        aria-label="로그인"
      >
        <header className="bg-[linear-gradient(128deg,#245ad7_0%,#1aafdb_100%)] px-8 pb-7 pt-8 text-[#eaf3ff]">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-white/20 text-xl font-extrabold text-white">
              CW
            </div>
            <div>
              <strong className="text-[1.8rem] leading-none">CostWise</strong>
              <p className="m-0 text-[rgba(238,245,255,0.92)]">
                원가·평가 통합관리 플랫폼
              </p>
            </div>
          </div>
          <p className="m-0 text-[rgba(238,245,255,0.92)]">
            프로젝트 원가관리와 금융상품 가치평가를 하나의 운영 흐름으로
            관리합니다.
          </p>
        </header>

        <form
          className="grid gap-3.5 bg-[#f9fbff] px-8 pb-8 pt-7"
          onSubmit={handleSubmit}
        >
          <label className="grid gap-1.5">
            <span className="text-[0.92rem] font-extrabold text-[#233150]">
              아이디
            </span>
            <input
              className="w-full rounded-xl border border-[#c8d2e6] px-3 py-[11px]"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[0.92rem] font-extrabold text-[#233150]">
              비밀번호
            </span>
            <input
              className="w-full rounded-xl border border-[#c8d2e6] px-3 py-[11px]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="rounded-xl bg-[#2a4ab8] px-3.5 py-[11px] text-[0.98rem] font-extrabold text-white"
            type="submit"
          >
            로그인
          </button>
          {error ? (
            <p className="m-0 text-[0.88rem] text-[#dc2626]" role="alert">
              {error}
            </p>
          ) : null}

          <section className="mt-1 rounded-xl border border-[#dae3f1] bg-[#edf2f9] px-3 py-2.5 text-[#4b5a79]">
            <strong>테스트 계정</strong>
            <p className="mt-1">CostWise 관리자: admin / admin123</p>
            <p className="mt-1">본부장/임원: cfo / user123</p>
            <p className="mt-1">원가 담당: analyst / user123</p>
            <p className="mt-1">감사/열람: viewer / user123</p>
          </section>
        </form>
      </section>
    </div>
  );
}
