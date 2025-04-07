// import type { Config } from "./types.ts";

export const config = {
  admin: Deno.env
    .get("ADMIN")!
    .split(",")
    .map((item) => Number(item)),
  telegram: {
    token: Deno.env.get("TELEGRAM_TOKEN")!,
    channel_id: Deno.env.get("TELEGRAM_CHANNEL_ID") ? Number(Deno.env.get("TELEGRAM_CHANNEL_ID")) : undefined,
  },
  twitch: {
    channel: Deno.env.get("TWITCH_CHANNEL"),
  },
};

export type Config = typeof config;
