"use client"

import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { getCurrentUserId } from '@/lib/photo-upload'

export function NotificationPrompt() {
  const [userId, setUserId] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
  } = usePushNotifications(userId)

  useEffect(() => {
    const id = getCurrentUserId()
    setUserId(id)

    // Check if user has already dismissed
    const dismissed = localStorage.getItem('notification_prompt_dismissed')
    setIsDismissed(dismissed === 'true')
  }, [])

  useEffect(() => {
    // Show prompt if:
    // - Push is supported
    // - Permission is default (not asked yet)
    // - Not already subscribed
    // - Not dismissed
    // - User is logged in
    if (
      isSupported &&
      permission === 'default' &&
      !isSubscribed &&
      !isDismissed &&
      userId
    ) {
      // Show after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isSupported, permission, isSubscribed, isDismissed, userId])

  const handleEnable = async () => {
    const success = await requestPermission()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('notification_prompt_dismissed', 'true')
    setIsDismissed(true)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Ota ilmoitukset käyttöön
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Saat ilmoituksen kun matchaat jonkun kanssa tai saat viestin!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-2 px-4 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Aktivoidaan...' : 'Ota käyttöön'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Ei nyt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
