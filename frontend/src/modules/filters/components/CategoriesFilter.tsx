import { categories } from '@/utils/MockedData';
import { Badge } from '@/components/ui/badge';
import { useCategoryFilterCounts } from '@/hooks/use-filter-counts';

const CategoriesFilter = () => {
  const { data: categoryCounts, isLoading: countsLoading } = useCategoryFilterCounts();
  
  return (
    <div className="bg-background/95 backdrop-blur border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 lg:space-x-8 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              type="button"
              key={category.id}
              className={`whitespace-nowrap px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-full transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                category.active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-in zoom-in-50'
                  : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span>{category.label}</span>
              <Badge 
                variant={category.active ? "outline" : "secondary"} 
                className={`ml-2 text-xs ${category.active ? 'border-white/30 text-white' : ''}`}
              >
                {countsLoading ? '...' : (categoryCounts?.[category.value] || 0)}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesFilter;
