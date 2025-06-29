interface AccountProgressBarProps {
  percentage: number
  getProgressColor: (percentage: number) => string
  getProgressTextColor: (percentage: number) => string
}

export default function AccountProgressBar({ percentage, getProgressColor, getProgressTextColor }: AccountProgressBarProps) {
  return (
    <div className="bg-background/50 backdrop-blur border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Completitud de la cuenta</span>
            <span className={`text-sm font-semibold ${getProgressTextColor(percentage)}`}>{percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Completa tu perfil para obtener más visibilidad y mejores resultados
          </p>
        </div>
      </div>
    </div>
  )
}
