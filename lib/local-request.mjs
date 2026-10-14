const hosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  return (
    hosts.has(url.hostname) &&
    (!origin || origin === url.origin) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
