export function formatDateForChat(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  const isToday = now.toDateString() === date.toDateString();

  if (isToday) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${ampm} ${formattedHour}:${minutes}`;
  }

  if (diffInDays === 1) return '어제';
  if (diffInDays < 7) return `${diffInDays}일 전`;

  const nowYear = now.getFullYear();
  const dateYear = date.getFullYear();

  if (nowYear === dateYear) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  return `${dateYear}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
}
