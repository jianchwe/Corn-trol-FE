import { createContext, useContext, useState } from "react";

const RecordContext = createContext();

export function RecordProvider({ children }) {
  const [records, setRecordsState] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [lastSaved, setLastSaved] = useState(0);

  const setRecords = (newRecords) => {
    setRecordsState(newRecords);
    setLastUpdated(Date.now());
  };

  const deleteRecord = (id) => {
    setRecordsState((prev) => prev.filter((r) => r.id !== id));
    setLastUpdated(Date.now());
  };

  const updateRecordLocal = (id, content) => {
    setRecordsState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, content } : r)),
    );
  };

  const groupedRecords = records
    .reduce((acc, record) => {
      const d = new Date(record.date);
      const dateKey = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
      const existing = acc.find((g) => g.date === dateKey);
      if (existing) {
        existing.items.push(record);
      } else {
        acc.push({ date: dateKey, items: [record] });
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
