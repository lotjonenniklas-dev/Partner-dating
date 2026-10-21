import type { Metadata } from "next"
import { Conversation } from "@/components/conversation"

export const metadata: Metadata = {
  title: "Keskustelu",
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Conversation personId={id} />
}
