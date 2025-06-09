/* eslint-disable no-restricted-globals */
self.addEventListener("install", (event) => {
  console.log("✅ SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ SW activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("⏭ SKIP_WAITING received");
    self.skipWaiting();
  }
});
