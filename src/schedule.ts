import { Telegram } from "./telegram.ts";
import { Twitch } from "./twitch.ts";
import { State } from "./state.ts";
import { config } from "./config.ts";

export async function schedule(): Promise<void> {
  const tw = new Twitch(config.twitch.channel!);
  const tg = new Telegram(config.telegram.token!, config.telegram.channel_id!, config.twitch.channel!);
  const st = new State(config.db);

  const state = await st.get_post();

  if (!state || state.id === 0) {
    return;
  }

  const info = await tw.fetch();

  if (!info.online) {
    let counter = await st.get_offline_counter();
    if (counter >= 2) {
      const result = await tg.delete(state.id);
      console.info(`[delete] result ${result}`);
      if (result <= 0) {
        await st.set_post(0);
        await st.set_offline_counter(0);
        return;
      } else {
        let delete_counter = await st.get_delete_counter();
        delete_counter++;
        console.info(`[delete] counter ${delete_counter}`);
        if (delete_counter >= 3) {
          await st.set_post(0);
          await st.set_offline_counter(0);
          await st.set_delete_counter(0);
        } else {
          await st.set_delete_counter(delete_counter);
        }
      }
    } else {
      counter++;
      await st.set_offline_counter(counter);
    }
    return;
  } else {
    await st.set_offline_counter(0);
  }

  if (state.id > 0 && info.online) {
    const id = await tg.update(info, state.id, state.title);
    if (id < 0) {
      await st.set_post(0);
      await st.set_offline_counter(0);
    } else {
      await st.set_post(id, state.title);
    }
  }
}
