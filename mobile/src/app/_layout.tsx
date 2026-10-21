import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { PartnerProvider } from "../lib/store"
import { BackgroundLocationTracker } from "../components/background-location-tracker"
import { colors } from "../theme"

export default function RootLayout() {
  return (
    <PartnerProvider>
      <StatusBar style="dark" />
      <BackgroundLocationTracker />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </PartnerProvider>
  )
}
