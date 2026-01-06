export function getTodayString(): string {
  const today = new Date();
  return formatDateToString(today);
}

export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRecentDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDateToString(date));
  }

  return dates;
}

export function getPreviousDate(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return formatDateToString(date);
}
