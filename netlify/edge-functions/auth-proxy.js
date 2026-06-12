const RAILWAY = "https://pankosmia.up.qombi.com";
const SITE_ORIGIN = Deno.env.get("URL") || "https://obs-edit.netlify.app";

export default async (request) => {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, RAILWAY);

  const headers = new Headers(request.headers);
  headers.set("Origin", SITE_ORIGIN);

  const response = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.method !== "GET" ? request.body : undefined,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const config = {
  path: "/auth/*",
};
