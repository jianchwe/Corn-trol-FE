import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import SplashScreen from "./src/screens/SplashScreen";
import PopcornScreen from "./src/screens/PopcornScreen";
import AlgokScreen from "./src/screens/AlgokScreen";
import FocusModeScreen from "./src/screens/FocusModeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

import { UserProvider } from "./src/context/UserContext";

import { RecordProvider } from "./src/context/RecordContext";

import { Popcorn, Note, Timer, UserCircle } from "phosphor-react-native";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Pretendard-Regular": require("./assets/fonts/Pretendard-Regular.ttf"),
        "Pretendard-Medium": require("./assets/fonts/Pretendard-Medium.ttf"),
        "Pretendard-SemiBold": require("./assets/fonts/Pretendard-SemiBold.ttf"),
        "Pretendard-Bold": require("./assets/fonts/Pretendard-Bold.ttf"),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <UserProvider>
      <RecordProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarStyle: {
                height: 80,
                paddingBottom: 8,
                paddingTop: 4,
              },
              tabBarLabelStyle: {
                paddingTop: 3,
                fontSize: 11,
              },
              headerShown: false,
              tabBarIcon: ({ focused }) => {
                const color = focused ? colors.primary : colors.textSecondary;
                const weight = focused ? "fill" : "regular";
                const size = 26;

                if (route.name === "팝콘수집기")
                  return <Popcorn size={size} color={color} weight={weight} />;
                if (route.name === "알곡꿰기")
                  return <Note size={size} color={color} weight={weight} />;
                if (route.name === "알곡식히기")
                  return <Timer size={size} color={color} weight={weight} />;
                if (route.name === "프로필")
                  return (
                    <UserCircle size={size} color={color} weight={weight} />
                  );
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textSecondary,
            })}
          >
            <Tab.Screen name="팝콘수집기" component={PopcornScreen} />
            <Tab.Screen name="알곡꿰기" component={AlgokScreen} />
            <Tab.Screen name="알곡식히기" component={FocusModeScreen} />
            <Tab.Screen name="프로필" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </RecordProvider>
    </UserProvider>
  );
}
