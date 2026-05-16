import { createContext, useContext, useState } from "react";

const RecordContext = createContext();

export function RecordProvider({ children }) {
  const [records, setRecords] = useState([]); // 전체 기록

  // 기록 추가
  const addRecord = (record) => {
    const newRecord = {
      id: Date.now(),
      content: record.content,
      type: record.type, // 'text' or 'voice'
      date: record.date,
      uri: record.uri || null, // 음성 파일 경로
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  // 기록 삭제
  const deleteRecord = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // 날짜별로 그룹화
  const groupedRecords = records
    .reduce((acc, record) => {
      const d = new Date(record.date);
      const dateKey = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

      const existing = acc.find((g) => g.date === dateKey);
      if (existing) {
        existing.items.unshift(record);
      } else {
        acc.push({ date: dateKey, items: [record] }); // 같은날 최신순
      }
      return acc;
    }, [])
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <RecordContext.Provider
      value={{ records, groupedRecords, addRecord, deleteRecord }} // 최신순
    >
      {children}
    </RecordContext.Provider>
  );
}

export function useRecord() {
  return useContext(RecordContext);
}
