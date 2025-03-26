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