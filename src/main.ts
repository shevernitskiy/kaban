import { Bot, webhookCallback, GrammyError, HttpError } from "grammy";
import { Hono } from "@hono/hono";
import { streamText } from "@hono/hono/streaming";

import { Telegram } from "./telegram.ts";
import { Twitch } from "./twitch.ts";
import { getState } from "./state.ts";
import { isDenoDeploy } from "./utils.ts";
import { getConfig } from "./config.ts";
import { schedule } from "./schedule.ts";

export const bot = new Bot(Deno.env.get("TELEGRAM_TOKEN")!);

bot.on("message", async (ctx) => {
  if (!ctx.hasChatType("private") || +Deno.env.get("ADMIN")! !== ctx.from.id) return;

  let text = ctx.message?.text ?? ctx.message?.caption;

  if (text === "ping") {
    console.info(`[ping] ${ctx.from.id}`);
    await ctx.reply("pong");
    return;
  }

  if (text === "pong") {
    console.info(`[pong] ${ctx.from.id}`);
    await ctx.reply("ping");
    return;
  }

  if (text?.startsWith("анонс") || text?.startsWith("Анонс")) {
    text = text.replace("анонс", "").replace("Анонс", "").trim();
    using config = await getConfig();
    await using state = await getState(config.db);

    const tw = new Twitch(config.twitch.channel!);
    const tg = new Telegram(config.telegram.token!, config.telegram.channel_id!, config.twitch.channel!);
    // const st = new State(config.db);

    const info = await tw.fetch();
    // const state = await st.get_post();



    if (state.telegram.id > 0) {
      const result = await tg.delete(state.telegram.id);
      console.info(`[delete] result ${result}`);
    }

    const id = await tg.create(info, text);

    // await st.set_post(id, text);

    state.telegram.id = id;
    state.telegram.title = text;
    state.offline_counter = 0;

    // await st.set_offline_counter(0);

    await ctx.reply("✅ анонс создан");
    console.info(`[create] post ${id} - ${text}`);

    return;
  }
});

bot.catch((err) => {
  console.error(`Error while handling update ${err.ctx.update.update_id}:`);

  if (err.error instanceof GrammyError) {
    console.error("Error in request:", err.error.description);
  } else if (err.error instanceof HttpError) {
    console.error("Could not contact Telegram:", err.error);
  } else {
    console.error("Unknown error:", err.error as Error);
  }
});

if (!isDenoDeploy) {
  bot.start();
} else {
  const server = new Hono();
  const handler = webhookCallback(bot, "std/http");

  server.get("/", (c) => c.text("Ok"));

  server.get("/schedule", async (c) => {
    await schedule();
    return c.text("Ok, schedule");
  });

  server.post("/telegram", (c) => {
    return streamText(c, async (stream) => {
      await stream.writeln("Ok");
      await stream.close();
      await handler(c.req.raw);
    });
  });

  Deno.serve({ port: 8080 }, server.fetch);
}

Deno.cron("reload", "*/2 * * * *", async () => {
  await schedule();
});