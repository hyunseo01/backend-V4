import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDateForChat(date: Date): string {
  const now = dayjs().tz('Asia/Seoul');
  const target = dayjs(date).tz('Asia/Seoul');

  const diffInDays = now.diff(target, 'day');
  const isToday = now.isSame(target, 'day');

  if (isToday) {
    const hour = target.hour();
    const minute = target.minute().toString().padStart(2, '0');
    const ampm = hour < 12 ? '오전' : '오후';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${ampm} ${formattedHour}:${minute}`;
  }

  if (diffInDays === 1) return '어제';
  if (diffInDays < 7) return `${diffInDays}일 전`;

  const nowYear = now.year();
  const dateYear = target.year();

  if (nowYear === dateYear) {
    return `${target.month() + 1}월 ${target.date()}일`;
  }

  return `${dateYear}.${(target.month() + 1).toString().padStart(2, '0')}.${target
    .date()
    .toString()
    .padStart(2, '0')}`;
}
