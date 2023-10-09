import { PostState } from "./types.ts";

export class State {
  constructor(private db: Deno.Kv) {}

  async get_post(): Promise<PostState | undefined> {
    const res = await this.db.get<PostState>(["post"]);
    return res.value ?? undefined;
  }

  async set_post(id: number, title?: string): Promise<void> {
    await this.db.set(["post"], { id: id, title: title });
  }

  async get_offline_counter(): Promise<number> {
    const res = await this.db.get<number>(["offline_counter"]);
    return res.value ?? 0;
  }

  async set_offline_counter(value: number): Promise<void> {
    await this.db.set(["offline_counter"], value);
  }
}
