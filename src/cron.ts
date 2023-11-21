import { schedule } from "./schedule.ts";

Deno.cron("reload", "*/2 * * * *", async () => {
  await schedule();
});
