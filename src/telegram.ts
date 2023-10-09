import { Api, InlineKeyboard, RawApi } from "grammy";

import type { MessageId, StreamInfo } from "./types.ts";
import { duration } from "./utils.ts";

const DEFAULT_PREVIEW = "https://cdnr.escharts.com/uploads/public/60b/75e/9bc/60b75e9bc28bf143747109.jpeg" as const;

export class Telegram {
  readonly name = "telegram";

  private api: Api<RawApi>;

  constructor(private token: string, private channel_id: number, private channel_name: string) {
    this.api = new Api(token);
  }

  async create(stream_info: StreamInfo, title?: string): Promise<MessageId> {
    try {
      const img = stream_info.preview ? `${stream_info.preview}?dt=${Date.now()}` : DEFAULT_PREVIEW;
      const res = await this.api.sendPhoto(this.channel_id, img, {
        reply_markup: this.button(),
        caption: this.createMessage(stream_info, title ?? "Стрим идёт, присоединяйся!"),
        parse_mode: "HTML",
      });
      return res.message_id;
    } catch (_err) {
      console.error("failed to create message");
      return 0;
    }
  }

  async update(stream_info: StreamInfo, message_id: MessageId, title?: string): Promise<MessageId> {
    try {
      const img = stream_info.preview ? `${stream_info.preview}?dt=${Date.now()}` : DEFAULT_PREVIEW;
      const res = await this.api.editMessageMedia(this.channel_id, message_id, {
        type: "photo",
        media: img,
        caption: this.createMessage(stream_info, title ?? "Стрим идёт, присоединяйся!"),
        parse_mode: "HTML",
      }, { reply_markup: this.button() });
      return typeof res == "boolean" ? message_id : res.message_id;
    } catch (err) {
      console.error("failed to update message");
      if (err.message.includes("MESSAGE_ID_INVALID")) {
        return -1;
      } else {
        return message_id;
      }
    }
  }

  async delete(message_id: MessageId): Promise<number> {
    try {
      await this.api.deleteMessage(this.channel_id, message_id);
      return 0;
    } catch (err) {
      console.error("failed to delete message");
      if (err.message.includes("MESSAGE_ID_INVALID")) {
        return -1;
      } else {
        return message_id;
      }
    }
  }

  createMessage(stream_info: StreamInfo, title: string): string {
    return [
      `<b>🔴 ${title}</b>`,
      "",
      `Название: ${stream_info.title ?? "-"}`,
      `Категория: ${stream_info.category ?? "-"}`,
      stream_info.start_time > 0 ? `Длительность: ${duration(stream_info.start_time)}\n` : "",
      `👤 ${stream_info.viewers ?? 0} `,
    ].join("\n");
  }

  button(): InlineKeyboard {
    return new InlineKeyboard().url("СМОТРЕТЬ СТРИМ", `https://twitch.tv/${this.channel_name}`);
  }
}
