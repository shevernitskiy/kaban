import { difference } from "timediff";

export function isDenoDeploy(): boolean {
  return Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
}

export function duration(dt: number): string {
  const diff = difference(new Date(dt), new Date(), { units: ["hours", "minutes", "seconds"] });
  const hours = diff.hours ?? 0;
  const minutes = (diff.minutes ?? 0) - hours * 60;
  const seconds = (diff.seconds ?? 0) - (diff.minutes ?? 0) * 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${
    seconds.toString().padStart(2, "0")
  }`;
}
