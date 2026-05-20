import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Svg, Line, Path } from "react-native-svg";
import { colors, typography, spacing } from "../theme";
import { X } from "phosphor-react-native";

const WIDTH = 320;
const HEIGHT = 450;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const CENTER_RADIUS = 48;
const ORBIT_RADIUS = 110;
const RECT_WIDTH = 85;
const RECT_HEIGHT = 85;

export default function MindMapView({
  keyword,
  records,
  links = [],
  onDelete,
  onEdit,
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState("");
  const selectedRecordRef = useRef(null);

  const childPositions = records.map((record, index) => {
    const angle = (2 * Math.PI * index) / records.length - Math.PI / 2;
    return {
      ...record,
      x: CENTER_X + ORBIT_RADIUS * Math.cos(angle),
      y: CENTER_Y + ORBIT_RADIUS * Math.sin(angle),
    };
  });

  return (
    <View style={[styles.container, { width: WIDTH, height: HEIGHT }]}>
      {/* 연결선 */}
      <Svg width={WIDTH} height={HEIGHT} style={StyleSheet.absoluteFill}>
        {childPositions.map((node) => (
          <Line
            key={`line-${node.id}`}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={node.x}
            y2={node.y}
            stroke={colors.border}
            strokeWidth={1.5}
          />
        ))}
        {/* 기록 간 연결선 */}
        {links.map((link) => {
          const source = childPositions.find((n) => n.id === link.sourceId);
          const target = childPositions.find((n) => n.id === link.targetId);
          if (!source || !target) return null;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const dx = midX - CENTER_X;
          const dy = midY - CENTER_Y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const cpX = midX + (dx / dist) * 60;
          const cpY = midY + (dy / dist) * 60;

          return (
            <Path
              key={`link-${link.sourceId}-${link.targetId}`}
              d={`M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`}
              stroke={colors.primary}
              strokeWidth={1.5}
              strokeDasharray="4,4"
              fill="none"
            />
          );
        })}
      </Svg>

      {/* 중앙 노드 */}
      <View
        style={[
          styles.centerNode,
          {
            left: CENTER_X - CENTER_RADIUS,
            top: CENTER_Y - CENTER_RADIUS,
            width: CENTER_RADIUS * 2,
            height: CENTER_RADIUS * 2,
            borderRadius: CENTER_RADIUS,
          },
        ]}
      >
        <Text style={styles.centerText}>{keyword?.replace(" & ", "\n& ")}</Text>
      </View>

      {/* 자식 노드 */}
      {childPositions.map((node) => (
        <TouchableOpacity
          key={`node-${node.id}`}
          style={[
            styles.childNode,
            {
              left: node.x - RECT_WIDTH / 2,
              top: node.y - RECT_HEIGHT / 2,
              width: RECT_WIDTH,
              height: RECT_HEIGHT,
            },
          ]}
          onPress={() => setSelectedRecord(node)}
        >
          <Text style={styles.childText} numberOfLines={3}>
            {node.content}
          </Text>
        </TouchableOpacity>
      ))}

      {/* 내용 모달 */}
      <Modal visible={!!selectedRecord} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSelectedRecord(null)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: "80%" }}>
            <View style={styles.modalBox}>
              <TouchableOpacity
                style={styles.modalCloseX}
                onPress={() => setSelectedRecord(null)}
              >
                <X size={16} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
              {selectedRecord?.date && (
                <Text style={styles.modalDate}>
                  {new Date(selectedRecord.date)
                    .toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                    .replace(/\. /g, ".")
                    .replace(/\.$/, "")}
                </Text>
              )}
              <Text style={styles.modalContent}>{selectedRecord?.content}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("", "이 기록을 삭제할까요?", [
                      {
                        text: "삭제",
                        style: "destructive",
                        onPress: () => {
                          onDelete && onDelete(selectedRecord.id);
                          setSelectedRecord(null);
                        },
                      },
                      { text: "취소", style: "cancel" },
                    ]);
                  }}
                >
                  <Text style={styles.modalDeleteText}>삭제</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    selectedRecordRef.current = selectedRecord;
                    setEditContent(selectedRecord.content);
                    setEditModalVisible(true);
                    setSelectedRecord(null);
                  }}
                >
                  <Text style={styles.modalEditText}>수정</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 수정 모달 */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity activeOpacity={1} style={{ width: "80%" }}>
              <View style={styles.modalEditBox}>
                <Text style={styles.modalEditTitle}>기록 수정</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalEditButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={() => {
                      onEdit &&
                        onEdit(selectedRecordRef.current.id, editContent);
                      setEditModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalSaveText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  centerNode: {
    position: "absolute",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  centerText: {
    fontSize: 14,
    fontFamily: "Pretendard-Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  childNode: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  childText: {
    fontSize: 10,
    fontFamily: "Pretendard-Regular",
    color: colors.textPrimary,
    textAlign: "center",
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
    paddingTop: spacing.xl,
  },
  modalEditBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: spacing.lg,
    marginTop: 180,
  },
  modalContent: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  modalCloseX: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: spacing.md,
  },
  modalDate: {
    ...typography.small,
    color: colors.textSecondary,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  modalEditButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  modalEditText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: "Pretendard-SemiBold",
    marginBottom: 5,
  },
  modalDeleteButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  modalDeleteText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  modalEditTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
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
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalSaveText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: "Pretendard-SemiBold",
  },
});
