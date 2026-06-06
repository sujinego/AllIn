export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
        이용약관
      </h1>
      <div className="prose prose-sm space-y-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제1조 (목적)</h2>
          <p>이 약관은 인테리어 비용공개(이하 "서비스")가 제공하는 인테리어 후기 공유 플랫폼 서비스의 이용에 관한 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제2조 (이용자 의무)</h2>
          <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>허위 사실을 포함한 게시물 작성</li>
            <li>타인의 명예를 훼손하는 내용 게시</li>
            <li>광고·협찬 후기 미표시 (표시광고법 위반)</li>
            <li>타인의 개인정보 무단 공개</li>
            <li>저작권이 없는 이미지 무단 업로드</li>
            <li>동일 업체에 대한 조직적 허위 후기 작성</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제3조 (플랫폼 면책)</h2>
          <p>서비스는 이용자가 작성한 후기의 정확성, 신뢰성을 보증하지 않습니다. 후기 내용의 허위 또는 부정확으로 인한 피해에 대해 서비스는 법령이 정한 범위 내에서만 책임을 집니다. 서비스는 업체와 이용자 간 거래의 중개자가 아니며, 이들 간 분쟁에 개입하지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제4조 (콘텐츠 라이선스)</h2>
          <p>이용자가 업로드한 사진 및 작성한 내용에 대해 서비스 내 비상업적 표시 목적의 사용 권한을 서비스에 부여합니다. 서비스는 이용자 콘텐츠를 외부 광고 등 상업적 목적으로 사용하려면 별도 동의를 받아야 합니다.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제5조 (콘텐츠 삭제 및 제재)</h2>
          <p>서비스는 다음 경우 사전 통보 없이 게시물을 삭제하거나 계정을 정지할 수 있습니다:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>신고 접수 후 검토 결과 규정 위반이 확인된 경우</li>
            <li>동일 게시물에 대한 신고가 3건 이상 접수된 경우 (임시 블라인드)</li>
            <li>법원, 수사기관 등의 요청이 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>제6조 (준거법 및 관할)</h2>
          <p>이 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.</p>
        </section>

        <p className="text-xs pt-4 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          본 약관은 2025년 1월 1일부터 시행됩니다.
        </p>
      </div>
    </div>
  )
}
