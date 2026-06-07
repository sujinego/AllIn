"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="white"
        d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
      />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_error: "소셜 로그인에 실패했습니다. 다시 시도해주세요.",
  naver_auth_failed: "네이버 로그인에 실패했습니다.",
  naver_token_failed: "네이버 인증에 실패했습니다. 다시 시도해주세요.",
  naver_no_email:
    "네이버 계정에 이메일이 없습니다. 이메일 로그인을 사용해주세요.",
  naver_not_configured: "네이버 로그인이 아직 설정되지 않았습니다.",
  session_error: "세션 생성에 실패했습니다. 다시 시도해주세요.",
  invalid_state: "보안 오류가 발생했습니다. 다시 시도해주세요.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] ?? "로그인에 실패했습니다.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleSocialLogin = async (provider: "google") => {
    setSocialLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
      setSocialLoading(null);
    }
  };

  const handleNaverLogin = () => {
    setSocialLoading("naver");
    setError("");
    window.location.href = "/api/auth/naver";
  };

  const isDisabled = loading || !!socialLoading;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: "var(--color-accent)" }}
          >
            인
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            로그인
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            인테리어 비용공개 커뮤니티에 오신걸 환영합니다
          </p>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={isDisabled}
            className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2.5 border transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: "white",
              borderColor: "#dadce0",
              color: "#3c4043",
            }}
          >
            <GoogleIcon />
            {socialLoading === "google" ? "로그인 중..." : "구글로 계속하기"}
          </button>

          {/* <button
            onClick={handleNaverLogin}
            disabled={isDisabled}
            className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: '#03C75A', color: 'white' }}
          >
            <NaverIcon />
            {socialLoading === 'naver' ? '로그인 중...' : '네이버로 계속하기'}
          </button> */}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex-1 h-px"
            style={{ background: "var(--color-border)" }}
          />
          <span
            className="text-xs whitespace-nowrap"
            style={{ color: "var(--color-text-muted)" }}
          >
            또는 이메일로 로그인
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "var(--color-border)" }}
          />
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{
                borderColor: "var(--color-border)",
                background: "white",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{
                borderColor: "var(--color-border)",
                background: "white",
              }}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-accent)" }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          아직 회원이 아니신가요?{" "}
          <Link
            href="/auth/signup"
            className="font-semibold hover:underline"
            style={{ color: "var(--color-accent)" }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: "var(--color-accent)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
