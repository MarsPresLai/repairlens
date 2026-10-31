import { afterEach, describe, it, expect } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import { createApp } from "../server/index";
let server: Server | undefined;
afterEach(async () => {
  if (server)
    await new Promise<void>((resolve) => server!.close(() => resolve()));
});
async function start() {
  server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
describe("Local API boundaries — no model calls", () => {
  it("exposes status without credentials", async () => {
    const url = await start();
    const data = await (await fetch(url + "/api/status")).json();
    expect(Object.keys(data).sort()).toEqual([
      "calls",
      "configured",
      "limit",
      "model",
    ]);
    expect(data.calls).toBe(0);
  });
  it("rejects missing model confirmation before any model request", async () => {
    const url = await start();
    const response = await fetch(url + "/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: 0,
        modelConfirmed: false,
        image: "data:image/jpeg;base64,AAAA",
      }),
    });
    expect(response.status).toBe(400);
  });
  it("rejects external origins", async () => {
    const url = await start();
    const response = await fetch(url + "/api/check", {
      method: "POST",
      headers: {
        Origin: "https://untrusted.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    expect(response.status).toBe(403);
  });
  it("rejects remote image URLs", async () => {
    const url = await start();
    const response = await fetch(url + "/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: 0,
        modelConfirmed: true,
        image: "https://example.com/image.jpg",
      }),
    });
    expect(response.status).toBe(400);
  });
  it("rejects invalid image bytes without spending a model call", async () => {
    const url = await start();
    const response = await fetch(url + "/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: 0,
        modelConfirmed: true,
        image: "data:image/jpeg;base64,AAAA",
      }),
    });
    expect(response.status).toBe(400);
    expect((await (await fetch(url + "/api/status")).json()).calls).toBe(0);
  });
});
