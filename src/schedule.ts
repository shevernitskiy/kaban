import { Telegram } from "./telegram.ts";
import { Twitch } from "./twitch.ts";
import { getState } from "./state.ts";
import { getConfig } from "./config.ts";

export async function schedule(): Promise<void> {
  using config = await getConfig();
  await using state = await getState(config.db);

  const tw = new Twitch(config.twitch.channel!);
  const tg = new Telegram(config.telegram.token!, config.telegram.channel_id!, config.twitch.channel!);

  if (state.telegram.id === 0) return;

  const info = await tw.fetch();

  if (!info.online) {
    if (state.offline_counter >= 2) {
      const result = await tg.delete(state.telegram.id);
      console.info(`[delete] result ${result}`);
      if (result <= 0) {
        state.telegram.id = 0;
        state.telegram.title = "";
        state.offline_counter = 0;
        return;
      } else {
        state.delete_counter++;
        console.info(`[delete] counter ${state.delete_counter}`);
        if (state.delete_counter >= 3) {
          state.telegram.id = 0;
          state.telegram.title = "";
          state.offline_counter = 0;
          state.delete_counter = 0;
        }
      }
    } else {
      state.offline_counter++;
    }
    return;
  } else {
    if (state.offline_counter > 0) {
      state.offline_counter = 0;
    }
  }

  if (state.telegram.id > 0 && info.online) {
    const id = await tg.update(info, state.telegram.id, state.telegram.title);
    if (id < 0) {
      state.telegram.id = 0;
      state.telegram.title = "";
      state.offline_counter = 0;
    }
  }
}
