import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  XCircle,
} from "phosphor-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, typography, spacing, preset } from "../theme";

import MindMapView from "../components/MindMapView";
import RecordCard from "../components/RecordCard";
import React from "react";
import { useRecord } from "../context/RecordContext";

import {
  getRecords,
  updateRecord,
  deleteRecord as deleteRecordApi,
  searchRecords,
  getMindMap,
} from "../api/records";

export default function AlgokScreen() {
  const [activeTab, setActiveTab] = useState("latest");
  const [searchText, setSearchText] = useState("");
  const [keywordIndex, setKeywordIndex] = useState(0);

  const { groupedRecords, deleteRecord, setRecords, updateRecordLocal } =
    useRecord();
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [mindMapData, setMindMapData] = useState([]);
  const [mindMapKeywords, setMindMapKeywords] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const mindmap = await getMindMap();
          console.log("마인드맵 결과:", JSON.stringify(mindmap));
          if (mindmap?.nodes?.length > 0) {
            // 마인드맵 구성
            const grouped = mindmap.nodes.reduce((acc, node) => {
              const existing = acc.find((g) => g.keyword === node.keyword);
              if (existing) {
                existing.records.push({
                  id: node.recordId,
                  content: node.keyword,
                });
              } else {
                acc.push({
                  keyword: node.keyword,
                  records: [{ id: node.recordId, content: node.keyword }],
                });
              }
              return acc;
            }, []);
            setMindMapData(grouped);
            setMindMapKeywords(grouped.map((g) => g.keyword));
          }
        } catch (e) {
          console.log("마인드맵 로드 실패", e.response?.data, e.message);
        }

        try {
          const data = await getRecords();
          if (data?.content?.length > 0) {
            setRecords(
              data.content.map((r) => ({
                id: r.recordId,
                content: r.content,
                type: r.type,
                date: new Date(r.createdAt),
                uri: r.audioUrl,
              })),
            );
          }
          // 빈 배열이면 setRecords 호출 안 함 → 로컬 데이터 유지
        } catch (e) {
          console.log("기록 목록 로드 실패", e.response?.data, e.message);
        }
      };
      fetchData();
    }, []),
  );

  const filteredRecords =
    searchText.trim() === ""
      ? groupedRecords
      : groupedRecords
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              item.content.toLowerCase().includes(searchText.toLowerCase()),
            ),
          }))
          .filter((group) => group.items.length > 0);

  const filteredKeywords =
    searchText.trim() === ""
      ? []
      : mindMapData.filter(
          (item) =>
            item.keyword?.includes(searchText) ||
            item.records.some((r) => r.content?.includes(searchText)),
        );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* 타이틀 */}
        <Text style={styles.title}>알곡 꿰기</Text>

        {/* 검색바 */}
        <View style={styles.searchBar}>
          <MagnifyingGlass
            size={20}
            color={colors.textSecondary}
            weight="bold"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="검색"
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {(isSearchFocused || searchText.length > 0) && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <XCircle size={20} color={colors.textSecondary} weight="fill" />
            </TouchableOpacity>
          )}
        </View>

        {/* 탭 토글 */}
        <View style={styles.tabRow}>
          <TouchableOpacity onPress={() => setActiveTab("latest")}>
            <Text
              style={[styles.tab, activeTab === "latest" && styles.tabActive]}
            >
              최신순
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("keyword")}>
            <Text
              style={[styles.tab, activeTab === "keyword" && styles.tabActive]}
            >
              키워드
            </Text>
          </TouchableOpacity>
        </View>

        {/* 최신순 탭 */}
        {activeTab === "latest" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredRecords.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchText ? "검색 결과가 없어요" : "아직 기록이 없어요"}
              </Text>
            ) : (
              filteredRecords.map((group) => (
                <View key={group.date}>
                  <Text style={styles.dateHeader}>{group.date}</Text>
                  {group.items.map((item) => (
                    <RecordCard
                      key={item.id}
                      content={item.content}
                      onDelete={async () => {
                        try {
                          await deleteRecordApi(item.id);
                          console.log("삭제 API 성공");
                        } catch (e) {
                          console.log("삭제 API 실패");
                        }
                        deleteRecord(item.id);
                      }}
                      onEdit={() => {
                        setEditingId(item.id);
                        setEditContent(item.content);
                        setEditModalVisible(true);
                      }}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* 키워드 탭 */}
        {activeTab === "keyword" && (
          <View style={styles.keywordContainer}>
            {searchText.trim() !== "" && !selectedKeyword ? (
              // 검색 결과 리스트
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredKeywords.length === 0 ? (
                  <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                ) : (
                  filteredKeywords.map((item) => (
                    <TouchableOpacity
                      key={item.keyword}
                      style={styles.keywordListItem}
                      onPress={() => setSelectedKeyword(item)}
                    >
                      <Text style={styles.keywordListText}>{item.keyword}</Text>
                      <Text style={styles.keywordListCount}>
                        기록 {item.records.length}개
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            ) : selectedKeyword ? (
              // 선택된 키워드 마인드맵
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedKeyword(null)}
                >
                  <CaretLeft size={18} color={colors.primary} weight="bold" />
                  <Text style={styles.backButtonText}>목록으로</Text>
                </TouchableOpacity>
                <Text style={styles.keywordTitle2}>
                  {selectedKeyword.keyword}
                </Text>
                <View style={styles.mindmapPlaceholder}>
                  <MindMapView
                    keyword={selectedKeyword.keyword}
                    records={selectedKeyword.records}
                  />
                </View>
              </View>
            ) : (
              // 기본 네비게이터
              <>
                <View style={styles.keywordNav}>
                  <TouchableOpacity
                    onPress={() =>
                      setKeywordIndex(
                        keywordIndex === 0
                          ? mindMapKeywords.length - 1
                          : keywordIndex - 1,
                      )
                    }
                  >
                    <CaretLeft
                      size={20}
                      color={colors.textSecondary}
                      weight="bold"
                    />
                  </TouchableOpacity>
                  <Text style={styles.keywordTitle}>
                    {mindMapKeywords[keywordIndex]}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setKeywordIndex(
                        keywordIndex === mindMapKeywords.length - 1
                          ? 0
                          : keywordIndex + 1,
                      )
                    }
                  >
                    <CaretRight
                      size={20}
                      color={colors.textSecondary}
                      weight="bold"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.mindmapPlaceholder}>
                  <MindMapView
                    keyword={mindMapData[keywordIndex]?.keyword}
                    records={mindMapData[keywordIndex]?.records || []}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* 기록 수정 모달 */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>기록 수정</Text>
              <TextInput
                style={styles.modalInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalCancel}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    console.log("수정 ID:", editingId, "내용:", editContent);
                    try {
                      await updateRecord(editingId, editContent);
                      console.log("수정 API 성공");
                      updateRecordLocal(editingId, editContent);
                    } catch (e) {
                      console.log("수정 API 실패:", e.message);
                    }
                    setEditModalVisible(false);
                    // 모달 닫힌 후 기록 다시 불러오기
                    try {
                      const data = await getRecords();
                      if (data?.content?.length > 0) {
                        setRecords(
                          data.content.map((r) => ({
                            id: r.recordId,
                            content: r.content,
                            type: r.type,
                            date: new Date(r.createdAt),
                            uri: r.audioUrl,
                          })),
                        );
                      }
                    } catch (e) {
                      console.log("기록 목록 로드 실패");
                    }
                  }}
                >
                  <Text style={styles.modalConfirm}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
    color: colors.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...preset.card,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 13,
    marginBottom: spacing.md,
  },
  tab: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tabActive: {
    color: colors.primary,
    fontFamily: "Pretendard-Bold",
  },
  dateHeader: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    fontFamily: "Pretendard-SemiBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: spacing.lg,
    width: "80%",
    marginTop: 180,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    height: 120,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalConfirm: {
    ...typography.body,
    color: colors.primary,
    fontFamily: "Pretendard-SemiBold",
  },
  keywordContainer: {
    flex: 1,
  },
  keywordNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  keywordTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    width: 200,
    textAlign: "center",
  },
  mindmapPlaceholder: {
    flex: 0.95,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...preset.card,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  keywordListItem: {
    ...preset.card,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keywordListText: {
    ...typography.body,
    color: colors.textPrimary,
    fontFamily: "Pretendard-SemiBold",
  },
  keywordListCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: "Pretendard-SemiBold",
  },
  keywordTitle2: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
