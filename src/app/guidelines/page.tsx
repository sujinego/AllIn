export default function GuidelinesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        커뮤니티 가이드라인
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
        인테리어 비용공개를 건강하게 유지하기 위한 규칙입니다.
      </p>

      <div className="space-y-6">
        {[
          {
            emoji: '✅',
            title: '사실에 근거한 내용만 작성하세요',
            desc: '실제 경험한 내용을 사실 그대로 작성해주세요. 과장, 축소, 허위 정보는 다른 이용자에게 피해를 줄 수 있으며 법적 책임이 발생할 수 있습니다.',
          },
          {
            emoji: '📢',
            title: '광고/협찬은 반드시 표시하세요',
            desc: '업체로부터 할인, 무료 시공, 현금, 상품권 등 경제적 대가를 받은 경우 반드시 광고/협찬 체크박스를 선택해야 합니다. 이는 표시광고법에 따른 의무입니다.',
          },
          {
            emoji: '🔒',
            title: '개인정보를 포함하지 마세요',
            desc: '사진에 얼굴, 주소, 주민등록증, 연락처 등 개인정보가 포함되지 않도록 주의해주세요. 업체 직원 개인 연락처도 공개하지 마세요.',
          },
          {
            emoji: '📷',
            title: '본인 사진만 업로드하세요',
            desc: '직접 촬영한 사진이나 사용 권한이 있는 이미지만 업로드해야 합니다. 인터넷, 잡지, 업체 포트폴리오 사진을 허락 없이 사용하면 저작권 침해입니다.',
          },
          {
            emoji: '🏢',
            title: '업체 비방은 자제해주세요',
            desc: '사실에 근거한 비판은 괜찮지만, 악의적인 비방이나 허위 사실로 업체의 명예를 훼손하는 행위는 형사 처벌 대상이 될 수 있습니다.',
          },
          {
            emoji: '🚨',
            title: '문제가 되는 게시물은 신고해주세요',
            desc: '허위 정보, 명예훼손, 광고 미표시, 개인정보 노출, 저작권 침해 내용을 발견하면 신고 기능을 사용해주세요. 운영팀이 72시간 내에 검토합니다.',
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-4 p-5 rounded-2xl border bg-white"
            style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-2xl flex-shrink-0">{item.emoji}</span>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>제재 기준</p>
        <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <p>· 동일 게시글 신고 3건 이상 → 자동 임시 블라인드</p>
          <p>· 운영팀 검토 후 위반 확인 → 게시글 삭제 + 경고</p>
          <p>· 반복 위반 → 계정 영구 정지</p>
          <p>· 허위 신고 → 신고자 계정 제재</p>
        </div>
      </div>
    </div>
  )
}
