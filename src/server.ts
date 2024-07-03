import nhttp from "@nhttp/nhttp";
import { webhookCallback } from "grammy";
import { schedule } from "./schedule.ts";
import { bot } from "./bot.ts";

Deno.cron("reload", "*/2 * * * *", async () => {
  await schedule();
});

const app = nhttp();
const handler = webhookCallback(bot, "std/http");

app.get("/", () => {
  return "Ok";
});

app.get("/schedule", async () => {
  await schedule();
  return "Ok, schedule";
});

app.post("/telegram", async (rev) => {
  await handler(rev.newRequest);
  return "Ok, telegram";
});

app.listen(8080);
