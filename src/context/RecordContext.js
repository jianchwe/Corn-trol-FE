import { createContext, useContext, useState } from "react";

const RecordContext = createContext();

export function RecordProvider({ children }) {
  const [records, setRecordsState] = useState([]); // 전체 기록
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [lastSaved, setLastSaved] = useState(0);

  // 기록 목록 교체 (API 데이터로)
  const setRecords = (newRecords) => {
    setRecordsState(newRecords);
    setLastUpdated(Date.now());
  };

  // // 로컬 기록 추가
  // const addRecord = (record) => {
  //   const newRecord = {
  //     id: Date.now(),
  //     content: record.content,
  //     type: record.type, // 'text' or 'voice'
  //     date: record.date,
  //     uri: record.uri || null, // 음성 파일 경로
  //   };
  //   setRecordsState((prev) => [newRecord, ...prev]);
  // };

  // 기록 삭제
  const deleteRecord = (id) => {
    setRecordsState((prev) => prev.filter((r) => r.id !== id));
    setLastUpdated(Date.now()); // 추가
  };

  const updateRecordLocal = (id, content) => {
    setRecordsState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, content } : r)),
    );
  };

  // 날짜별로 그룹화
  const groupedRecords = records
    .reduce((acc, record) => {
      const d = new Date(record.date);
      const dateKey = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

      const existing = acc.find((g) => g.date === dateKey);
      if (existing) {
        existing.items.push(record);
      } else {
        acc.push({ date: dateKey, items: [record] }); // 같은날 최신순
      }
      return acc;
    }, [])
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <RecordContext.Provider
      value={{
        records,
        setRecords,
        groupedRecords,
        deleteRecord,
        lastUpdated,
        updateRecordLocal,
        lastSaved,
        setLastSaved,
      }}
    >
      {children}
    </RecordContext.Provider>
  );
}

export function useRecord() {
  return useContext(RecordContext);
}
