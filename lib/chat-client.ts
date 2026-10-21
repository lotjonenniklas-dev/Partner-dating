import type { ChatMessage } from "@/lib/store"
import { sendPushToDevice } from "./push-subscriptions"

export async function sendMessage(fromDevice: string, toDevice: string, text: string, fromName?: string): Promise<boolean> {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_device: fromDevice, to_device: toDevice, text }),
    })
    
    // Lähetä push-ilmoitus vastaanottajalle
    if (response.ok && fromName) {
      void sendPushToDevice(toDevice, {
        title: fromName,
        body: text.length > 80 ? text.substring(0, 77) + "..." : text,
        url: `/chat/${fromDevice}`,
        tag: `message-${fromDevice}`,
      }).catch(() => {
        // Ei haittaa jos ilmoitus ei mene perille
      })
    }
    
    return response.ok
  } catch {
    return false
  }
}

export async function fetchMessages(myDevice: string, otherDevice: string): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `/api/messages?my_device=${encodeURIComponent(myDevice)}&other_device=${encodeURIComponent(otherDevice)}`,
    )
    if (!response.ok) return []
    const data = await response.json()
    return (data.messages || []).map((msg: any) => ({
      id: msg.id,
      from: msg.from_device === myDevice ? "me" : "them",
      text: msg.text,
      at: new Date(msg.created_at).getTime(),
    }))
  } catch {
    return []
  }
}
