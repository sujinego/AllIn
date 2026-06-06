import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('naver_oauth_state')?.value
  const origin = process.env.NEXT_PUBLIC_APP_URL!

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`)
  }

  try {
    const redirectUri = `${origin}/api/auth/naver/callback`

    // 네이버 액세스 토큰 발급
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
        state,
      }),
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_token_failed`)
    }

    // 네이버 회원 프로필 조회
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const { response: naverProfile } = await profileRes.json()

    if (!naverProfile?.email) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_no_email`)
    }

    // Supabase admin으로 매직링크 생성 (사용자 없으면 자동 생성)
    const admin = createAdminClient()
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: naverProfile.email,
      options: {
        redirectTo: `${origin}/auth/callback`,
        data: {
          full_name: naverProfile.name ?? naverProfile.nickname,
          provider: 'naver',
          naver_id: naverProfile.id,
          avatar_url: naverProfile.profile_image,
        },
      },
    })

    if (error || !linkData?.properties?.action_link) {
      console.error('Naver: generateLink error', error)
      return NextResponse.redirect(`${origin}/auth/login?error=session_error`)
    }

    const response = NextResponse.redirect(linkData.properties.action_link)
    response.cookies.delete('naver_oauth_state')
    return response
  } catch (err) {
    console.error('Naver auth error:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=naver_auth_failed`)
  }
}
