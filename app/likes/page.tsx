import type { Metadata } from "next"
import { SentLikes } from "@/components/sent-likes"

export const metadata: Metadata = {
  title: "Lähetetyt tykkäykset",
}

export default function LikesPage() {
  return <SentLikes />
}
