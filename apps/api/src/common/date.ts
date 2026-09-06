export function toDateOnly(value: string | Date) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00.000Z`) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isFutureDate(value: Date) {
  const today = toDateOnly(new Date());
  return value.getTime() > today.getTime();
}

export function daysBetween(start: Date, end: Date) {
  return Math.floor((toDateOnly(end).getTime() - toDateOnly(start).getTime()) / 86_400_000);
}

export function isWeekend(value: Date) {
  const day = value.getUTCDay();
  return day === 0 || day === 6;
}
