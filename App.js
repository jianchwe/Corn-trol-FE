import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as Font from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SplashScreen from "./src/screens/SplashScreen";
import PopcornScreen from "./src/screens/PopcornScreen";
import AlgokScreen from "./src/screens/AlgokScreen";
import FocusModeScreen from "./src/screens/FocusModeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";

import { UserProvider } from "./src/context/UserContext";
import { RecordProvider } from "./src/context/RecordContext";

import { Popcorn, Note, Timer, UserCircle } from "phosphor-react-native";
import { colors } from "./src/theme";

import client from "./src/api/client";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
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
            return <UserCircle size={size} color={color} weight={weight} />;
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
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // defult = false, 로그인 확인용

  useEffect(() => {
    // 서버 확인용
    // client
    //   .get("/auth/email/send")
    //   .then((res) => console.log("서버 연결 성공:", res.status))
    //   .catch((e) => console.log("서버 연결 실패:", e.message));

    async function init() {
      await Font.loadAsync({
        "Pretendard-Regular": require("./assets/fonts/Pretendard-Regular.ttf"),
        "Pretendard-Medium": require("./assets/fonts/Pretendard-Medium.ttf"),
        "Pretendard-SemiBold": require("./assets/fonts/Pretendard-SemiBold.ttf"),
        "Pretendard-Bold": require("./assets/fonts/Pretendard-Bold.ttf"),
      });

      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("userId");

      const token = await AsyncStorage.getItem("accessToken"); //로그인 확인용
      setIsLoggedIn(!!token); // 로그인 확인용
      setFontsLoaded(true);
    }
    init();
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
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
              <Stack.Screen name="Main" component={TabNavigator} />
            ) : (
              <>
                <Stack.Screen name="Login">
                  {(props) => (
                    <LoginScreen
                      {...props}
                      onLoginSuccess={() => setIsLoggedIn(true)}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Signup" component={SignupScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </RecordProvider>
    </UserProvider>
  );
}
