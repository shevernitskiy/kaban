import type { Config } from "./types.ts";

import { isDenoDeploy } from "./utils.ts";

async function getConfig(): Promise<Config> {
  const db = isDenoDeploy() ? undefined : "kv.db";
  const env_map = new Map<string, string>();

  if (!isDenoDeploy()) {
    const env = Deno.readTextFileSync("./.env");

    for (const line of env.split("\n")) {
      const kv = line.split("=");
      if (kv.length < 2) continue;
      env_map.set(kv[0].trim(), kv[1].trim());
    }
  }

  const map = isDenoDeploy() ? Deno.env : env_map;

  return {
    admin: Number(map.get("ADMIN")),
    db: await Deno.openKv(db),
    telegram: {
      token: map.get("TELEGRAM_TOKEN"),
      channel_id: map.get("TELEGRAM_CHANNEL_ID") ? Number(map.get("TELEGRAM_CHANNEL_ID")) : undefined,
    },
    twitch: {
      channel: map.get("TWITCH_CHANNEL"),
    },
  };
}

export const config = await getConfig();
