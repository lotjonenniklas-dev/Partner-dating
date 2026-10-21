import { Tabs } from "expo-router"
import { Text } from "react-native"
import { usePartner } from "../../lib/store"
import { colors } from "../../theme"

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.ink : colors.muted, fontSize: 12, fontWeight: "600" }}>
      {label}
    </Text>
  )
}

export default function TabLayout() {
  const { matches, pending } = usePartner()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profiili",
          tabBarIcon: ({ focused }) => <TabIcon label="Profiili" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Tutustu",
          tabBarIcon: ({ focused }) => <TabIcon label="Tutustu" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Osumat",
          tabBarBadge: matches.length > 0 ? matches.length : undefined,
          tabBarIcon: ({ focused }) => <TabIcon label="Osumat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: "Tykkäykset",
          tabBarBadge: pending.length > 0 ? pending.length : undefined,
          tabBarIcon: ({ focused }) => <TabIcon label="Tykkäykset" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
