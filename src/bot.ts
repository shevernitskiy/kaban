import { Bot, GrammyError, HttpError } from "grammy";

import { Telegram } from "./telegram.ts";
import { Twitch } from "./twitch.ts";
import { State } from "./state.ts";
import { isDenoDeploy } from "./utils.ts";
import { config } from "./config.ts";

export const bot = new Bot(config.telegram.token!);

bot.filter((ctx) => ctx.hasChatType("private") && config.admin.includes(ctx.from.id))
  .hears(/[А|а]нонс[\s]*(.*)*/, async (ctx) => {
    const tw = new Twitch(config.twitch.channel!);
    const tg = new Telegram(config.telegram.token!, config.telegram.channel_id!, config.twitch.channel!);
    const st = new State(config.db);

    const info = await tw.fetch();
    const state = await st.get_post();

    if (state && state.id > 0) {
      await tg.delete(state.id);
    }

    const id = await tg.create(info, ctx.match[1]);
    await st.set_post(id, ctx.match[1]);
    await st.set_offline_counter(0);

    await ctx.reply("✅ анонс создан");

    console.info(`[create] post ${id} - ${ctx.match[1]}`);
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
