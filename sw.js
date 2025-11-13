const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (!requestUrl.pathname.startsWith(scopePath)) {
    return;
  }

  const relativePath = requestUrl.pathname
    .slice(scopePath.length)
    .replace(/^\/+/g, "")
    .replace(/\/+$/g, "");

  if (!relativePath || relativePath.endsWith(".html") || relativePath.includes(".")) {
    return;
  }

  const targetUrl = new URL(requestUrl.href);
  targetUrl.pathname = `${requestUrl.pathname}.html`;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(targetUrl.toString(), { redirect: "follow" });
        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.error("Routing fetch failed", error);
      }
      return fetch(event.request);
    })()
  );
});
