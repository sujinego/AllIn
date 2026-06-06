import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t py-10" style={{ borderColor: 'var(--color-border)', background: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--color-accent-dark)' }}>
              인테리어 비용공개
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              실제 시공 비용을 투명하게 공유하는 커뮤니티
            </p>
            <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              이 플랫폼의 후기는 사용자가 직접 작성한 것으로,<br />
              운영팀은 내용의 정확성을 보증하지 않습니다.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div>
              <p className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>서비스</p>
              <div className="flex flex-col gap-1">
                <Link href="/posts" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>후기 목록</Link>
                <Link href="/posts/new" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>후기 작성</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>정책</p>
              <div className="flex flex-col gap-1">
                <Link href="/terms" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>이용약관</Link>
                <Link href="/privacy" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>개인정보처리방침</Link>
                <Link href="/guidelines" className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>커뮤니티 가이드</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <p>© 2025 인테리어 비용공개. 이 서비스는 중개 행위를 하지 않으며, 업체와 사용자 간 거래에 책임을 지지 않습니다.</p>
        </div>
      </div>
    </footer>
  )
}
