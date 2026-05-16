// 전체 기록 원본
const allRecords = [
  { id: 1, content: "재활용 디자인으로 환경 메시지 전달", date: "2026.05.05" },
  { id: 2, content: "관람객 참여형 전시 구성", date: "2026.05.05" },
  { id: 3, content: "SNS 바이럴 요소 추가", date: "2026.05.05" },
  { id: 4, content: "팝업스토어 아이디어", date: "2026.05.04" },
  { id: 5, content: "타겟 고객 분석", date: "2026.05.04" },
  { id: 6, content: "위치 선정 기준", date: "2026.05.03" },
  { id: 7, content: "브랜드 경험 설계", date: "2026.05.03" },
  { id: 8, content: "SNS 홍보 방법", date: "2026.05.03" },
  { id: 9, content: "운영 인력 구성", date: "2026.05.03" },
];

// AI 키워드
export const mockMindMapData = [
  {
    keyword: "전시 공모전 아이디어",
    records: [allRecords[0], allRecords[1], allRecords[2]],
  },
  {
    keyword: "마케팅 전략",
    records: [allRecords[3], allRecords[4]],
  },
  {
    keyword: "팝업스토어",
    records: [allRecords[5], allRecords[6], allRecords[7], allRecords[8]],
  },
];

export const mockKeywords = mockMindMapData.map((item) => item.keyword);

// 최신순
export const mockRecords = [
  {
    date: "2026.05.05",
    items: [allRecords[0], allRecords[1], allRecords[2]],
  },
  {
    date: "2026.05.04",
    items: [allRecords[3], allRecords[4]],
  },
  {
    date: "2026.05.03",
    items: [allRecords[5], allRecords[6], allRecords[7], allRecords[8]],
  },
];
