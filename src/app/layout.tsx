import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: '인테리어 비용공개 — 실제 시공 비용을 투명하게',
  description: '반셀프 인테리어, 턴키 업체 인테리어 실제 시공 비용과 후기를 공유하는 커뮤니티입니다. 평수별, 지역별, 스타일별 실제 가격 정보를 확인하세요.',
  keywords: '인테리어 비용, 셀프인테리어, 턴키인테리어, 인테리어 후기, 시공비용, 평당단가',
  openGraph: {
    title: '인테리어 비용공개',
    description: '실제 시공 비용을 투명하게 공유하는 커뮤니티',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
