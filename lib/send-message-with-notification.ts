/**
 * Send message with push notification
 */

import { sendMessageNotification, getStoredSubscription } from './send-notification'

export interface MessageData {
  from_device: string
  to_device: string
  text: string
  sender_name?: string
}

/**
 * Send a message and trigger push notification for recipient
 */
export async function sendMessageWithNotification(
  messageData: MessageData
): Promise<{ success: boolean; message?: any; error?: string }> {
  try {
    // Send the message via API
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_device: messageData.from_device,
        to_device: messageData.to_device,
        text: messageData.text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to send message' }
    }

    const result = await response.json()

    // Try to send push notification to recipient
    // Note: This works if the sender and recipient share localStorage (same device/browser)
    // In production, subscriptions should be in a database accessible by the API
    const recipientSubscription = getStoredSubscription(messageData.to_device)
    
    if (recipientSubscription && messageData.sender_name) {
      // Send notification in background (don't wait for it)
      sendMessageNotification(
        recipientSubscription,
        messageData.sender_name,
        messageData.text,
        messageData.from_device
      ).catch((error) => {
        console.warn('Failed to send push notification:', error)
        // Don't fail the message send if notification fails
      })
    }

    return { success: true, message: result.message }
  } catch (error) {
    console.error('Failed to send message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Client-side message sending for chat
 */
export async function sendChatMessage(
  fromUserId: string,
  toUserId: string,
  message: string,
  senderName: string
): Promise<boolean> {
  const result = await sendMessageWithNotification({
    from_device: fromUserId,
    to_device: toUserId,
    text: message,
    sender_name: senderName,
  })

  return result.success
}
