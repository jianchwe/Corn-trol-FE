import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme";
import CornTrolLogo from "../../assets/PopCorn_1.svg";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <CornTrolLogo width={120} height={120} />
      <Text style={styles.title}>Corn-trol</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    marginTop: spacing.sm,
    color: "#FFFFFF",
    fontSize: 26,
  },
});
