import { Bot, GrammyError, HttpError, webhookCallback } from "grammy";
import { Hono } from "@hono/hono";
import { streamText } from "@hono/hono/streaming";

import { isDenoDeploy } from "./utils.ts";
import { schedule } from "./logic.ts";
import { createAnnounce } from "./logic.ts";
import { config } from "./config.ts";

export const bot = new Bot(config.telegram.token!);

bot.on("message", async (ctx) => {
  if (
    !ctx.hasChatType("private") ||
    +Deno.env.get("ADMIN")! !== ctx.from.id ||
    +Deno.env.get("STREAMER")! !== ctx.from.id
  )
    return;

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
    const id = await createAnnounce(text);
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

  server.post("/telegram", (c) => {
    return streamText(c, async (stream) => {
      await stream.writeln("Ok");
      await stream.close();
      await handler(c.req.raw);
    });
  });

  Deno.serve({ port: 8080, onListen: () => ({}) }, server.fetch);
}

Deno.cron("reload", "*/2 * * * *", async () => {
  await schedule();
});
