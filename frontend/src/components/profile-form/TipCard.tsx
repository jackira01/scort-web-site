import { AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { ProfileFormTip } from '@/hooks/use-profile-form-tips';

interface TipCardProps {
  tip: ProfileFormTip;
}

const iconMap = {
  'lightbulb': Lightbulb,
  'check-circle': CheckCircle,
  'info': Info,
  'alert-triangle': AlertTriangle,
};

const colorMap = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    title: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600'
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-300',
    title: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    title: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-300',
    title: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600'
  }
};

export function TipCard({ tip }: TipCardProps) {
  const IconComponent = iconMap[tip.icon as keyof typeof iconMap] || Info;
  const colors = colorMap[tip.type] || colorMap.info;

  return (
    <div className={`${colors.bg} p-4 rounded-lg`}>
      <div className="flex items-center space-x-2 mb-2">
        <IconComponent className={`h-4 w-4 ${colors.icon}`} />
        <h3 className={`font-semibold ${colors.title}`}>
          {tip.title}
        </h3>
      </div>

      {Array.isArray(tip.content) ? (
        <ul className={`text-sm ${colors.text} space-y-1`}>
          {tip.content.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className={`text-sm ${colors.text}`}>
          {tip.content}
        </p>
      )}
    </div>
  );
}