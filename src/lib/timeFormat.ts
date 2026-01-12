// Time formatting utility with i18n support

/**
 * Formats time string (HH:MM) to localized format
 * @param time - Time in HH:MM format (24-hour)
 * @param language - Language code (ko, en, etc.)
 * @returns Formatted time string
 */
export function formatTime(time: string, language: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (language === 'ko') {
    // Korean format: 오전/오후 H:MM
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  } else {
    // English format: H:MM AM/PM
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}
