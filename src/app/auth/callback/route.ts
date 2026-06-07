import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // public.users 행이 없으면 생성 (이메일 인증 후 세션이 생긴 시점에 처리)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existing) {
          // 카카오 등 이메일 동의항목(사업자등록증 필요) 없이 가입하면 user.email이 없을 수 있음
          const email = user.email ?? `kakao_${user.id}@kakao.local`
          const nickname =
            user.user_metadata?.nickname ??
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            (user.email ? user.email.split('@')[0] : `사용자${user.id.slice(0, 8)}`)

          await supabase.from('users').insert({
            id: user.id,
            email,
            nickname,
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
