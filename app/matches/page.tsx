import type { Metadata } from "next"
import { Matches } from "@/components/matches"

export const metadata: Metadata = {
  title: "Osumat",
}

export default function MatchesPage() {
  return <Matches />
}
