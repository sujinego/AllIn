import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🏠</p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          삭제되었거나 존재하지 않는 페이지입니다.
        </p>
        <Link href="/"
          className="inline-flex items-center px-5 py-2.5 rounded-2xl text-white font-medium text-sm"
          style={{ background: 'var(--color-accent)' }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
