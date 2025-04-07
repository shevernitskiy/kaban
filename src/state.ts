import { proxify } from "@shevernitskiy/proxify";

const default_state = {
  telegram: {
    id: 0,
    title: "",
  },
  delete_counter: 0,
  offline_counter: 0,
  [proxify.is_mutated]: true,
};

export async function getState(): Promise<typeof default_state & { [Symbol.asyncDispose]: () => Promise<void> }> {
// db: Deno.Kv,
  const db = await Deno.openKv(Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined ? undefined : "kv.db");
  const state = (await db.get<typeof default_state>(["state"])).value ?? default_state;

  return proxify(state, async () => {
    if (state[proxify.is_mutated]) {
      console.log("saving state");
      state[proxify.is_mutated] = false;
      await db.set(["state"], state);
    }
    db.close();
  });
}
