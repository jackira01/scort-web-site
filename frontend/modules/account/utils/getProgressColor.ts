export function getProgressColor(percentage: number) {
  if (percentage < 50) return 'bg-red-500';
  if (percentage < 80) return 'bg-orange-500';
  return 'bg-green-500';
}

export function getProgressTextColor(percentage: number) {
  if (percentage < 50) return 'text-red-600 dark:text-red-400';
  if (percentage < 80) return 'text-orange-600 dark:text-orange-400';
  return 'text-green-600 dark:text-green-400';
}
