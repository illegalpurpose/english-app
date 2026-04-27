import { Tabs } from "expo-router";
import { Platform } from "react-native";

const COLORS = {
    bg: "#2a2424",
    surface: "#393232",
    elevated: "#4d4545",
    accent: "#8d6262",
    highlight: "#ed8d8d",
    text: "#f5eded",
    textDim: "#7a6464",
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.elevated,
                    borderTopWidth: 1,
                    height: Platform.OS === "ios" ? 85 : 65,
                    paddingBottom: Platform.OS === "ios" ? 28 : 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: COLORS.highlight,
                tabBarInactiveTintColor: COLORS.textDim,
                tabBarLabelStyle: {
                    fontSize: 11,
                    letterSpacing: 0.5,
                    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "search",
                    tabBarIcon: ({ color }) => (
                        <TabIcon label="◎" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-words"
                options={{
                    title: "my words",
                    tabBarIcon: ({ color }) => (
                        <TabIcon label="◈" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

function TabIcon({ label, color }: { label: string; color: string }) {
    const { Text } = require("react-native");
    return <Text style={{ fontSize: 20, color }}>{label}</Text>;
}
