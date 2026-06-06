export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
        개인정보 처리방침
      </h1>
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>1. 수집하는 개인정보 항목</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>필수: 이메일 주소, 닉네임</li>
            <li>서비스 이용 시 생성: 게시글, 댓글, 좋아요, 북마크 내역</li>
            <li>자동 수집: 접속 IP, 브라우저 정보, 쿠키</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>2. 개인정보 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 및 서비스 제공</li>
            <li>게시글 작성자 식별 및 신고 처리</li>
            <li>법적 분쟁 발생 시 증거 보전</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>3. 개인정보 보유 기간</h2>
          <p>회원 탈퇴 시 즉시 삭제합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다 (전자상거래법: 5년, 통신비밀보호법: 3개월).</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>4. 개인정보 제3자 제공</h2>
          <p>원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만 법원, 수사기관 등 법령에 의한 요청이 있는 경우는 예외입니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>5. 사용자 권리</h2>
          <p>회원은 언제든지 본인의 개인정보를 조회, 수정, 삭제를 요청할 수 있습니다. 탈퇴 시 모든 개인정보는 즉시 삭제되며, 게시글은 익명화 처리됩니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>6. 쿠키 사용</h2>
          <p>로그인 상태 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키 사용을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</p>
        </section>

        <p className="text-xs pt-4 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          개인정보 관련 문의: 서비스 내 신고 기능을 통해 접수해주세요.<br />
          본 방침은 2025년 1월 1일부터 시행됩니다.
        </p>
      </div>
    </div>
  )
}
