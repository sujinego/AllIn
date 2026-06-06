'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자 사이로 입력해주세요.')
      setLoading(false)
      return
    }

    // 닉네임 중복 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle()

    if (existing) {
      setError('이미 사용 중인 닉네임입니다.')
      setLoading(false)
      return
    }

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })

    if (signupError) {
      setError(signupError.message === 'User already registered'
        ? '이미 가입된 이메일입니다.'
        : '회원가입 중 오류가 발생했습니다.')
      setLoading(false)
      return
    }

    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        nickname,
      })
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            이메일을 확인해주세요
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>{email}</strong>으로 인증 메일을 발송했습니다.<br />
            메일 내 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link href="/auth/login"
            className="mt-6 inline-block px-6 py-3 rounded-2xl text-white font-medium text-sm"
            style={{ background: 'var(--color-accent)' }}>
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: 'var(--color-accent)' }}>
            인
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>회원가입</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            인테리어 비용공개 커뮤니티에 참여하세요
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              minLength={2}
              maxLength={20}
              placeholder="2~20자"
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'white' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'white' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8자 이상"
              className="w-full px-4 py-3 rounded-2xl border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'white' }}
            />
          </div>

          {/* 이용약관 동의 */}
          <div className="p-4 rounded-2xl text-xs space-y-2" style={{ background: 'var(--bg-secondary)', color: 'var(--color-text-secondary)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>가입 전 확인사항</p>
            <p>✅ 허위 사실 또는 명예훼손 내용 게시 금지</p>
            <p>✅ 광고/협찬 후기 반드시 표시</p>
            <p>✅ 타인의 개인정보 무단 공개 금지</p>
            <p>✅ 본인이 직접 촬영한 사진만 업로드</p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              회원가입 시 <Link href="/terms" className="underline">이용약관</Link>과{' '}
              <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          이미 회원이신가요?{' '}
          <Link href="/auth/login" className="font-semibold hover:underline"
            style={{ color: 'var(--color-accent)' }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
