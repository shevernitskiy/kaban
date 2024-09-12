import { Bot, GrammyError, HttpError } from "grammy";

import { Telegram } from "./telegram.ts";
import { Twitch } from "./twitch.ts";
import { State } from "./state.ts";
import { isDenoDeploy } from "./utils.ts";
import { config } from "./config.ts";

export const bot = new Bot(config.telegram.token!);

bot.on("message", async (ctx) => {
  if (!ctx.hasChatType("private") || !config.admin.includes(ctx.from.id)) return;

  const text = ctx.message?.text ?? ctx.message?.caption;

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
    console.log("here");
    const text_strip = text.replace("анонс", "").replace("Анонс", "").trim();
    const tw = new Twitch(config.twitch.channel!);
    const tg = new Telegram(config.telegram.token!, config.telegram.channel_id!, config.twitch.channel!);
    const st = new State(config.db);

    const info = await tw.fetch();
    const state = await st.get_post();

    if (state && state.id > 0) {
      const result = await tg.delete(state.id);
      console.info(`[delete] result ${result}`);
    }

    const id = await tg.create(info, text_strip);
    await st.set_post(id, text);
    await st.set_offline_counter(0);

    await ctx.reply("✅ анонс создан");
    console.info(`[create] post ${id} - ${text_strip}`);

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

if (!isDenoDeploy()) {
  bot.start();
}
