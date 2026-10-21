self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  event.respondWith(fetch(event.request))
})

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const title = typeof data.title === "string" && data.title ? data.title : "Partner"
  const body = typeof data.body === "string" ? data.body : ""
  const url = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/"
  const tag = typeof data.tag === "string" && data.tag ? data.tag : url
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      lang: "fi",
      tag,
      data: { url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const path =
    event.notification.data &&
    typeof event.notification.data.url === "string" &&
    event.notification.data.url.startsWith("/")
      ? event.notification.data.url
      : "/"
  const url = new URL(path, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const open = clients.find((client) => client.url.startsWith(self.location.origin))
      if (open) {
        await open.focus()
        if ("navigate" in open && typeof open.navigate === "function") {
          await open.navigate(url)
          return
        }
      }
      await self.clients.openWindow(url)
    }),
  )
})
