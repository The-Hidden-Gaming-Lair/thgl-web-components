const DEBUG =
  typeof window !== "undefined"
    ? localStorage.getItem("DEBUG") === "true"
    : false;
export function isDebug() {
  return DEBUG;
}

export const isOverwolf =
  typeof window !== "undefined" &&
  // @ts-expect-error
  typeof window.___overwolf___ !== "undefined";
