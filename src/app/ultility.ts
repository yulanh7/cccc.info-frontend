export const formatDate = (timestamp: string) => {
  const currentYear = new Date().getFullYear();
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  if (year === currentYear) {
    return `${day} ${month}`;
  }
  return `${day}/${date.getMonth() + 1}/${year}`;
};

export function getYouTubeThumbnail(url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault' = 'hqdefault') {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const videoId = match?.[1];
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
