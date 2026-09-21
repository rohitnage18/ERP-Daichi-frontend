/** India-calendar day key so field reports do not shift at UTC midnight. */
export function dateKeyIST(value: Date = new Date()): string {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
