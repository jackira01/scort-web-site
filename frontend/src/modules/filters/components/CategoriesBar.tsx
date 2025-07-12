import React from 'react';
import { categories } from '@/modules/filters/data';

const CategoriesBar = () => {
  return (
    <div className="bg-background/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 lg:space-x-8 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`whitespace-nowrap px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-full transition-all flex-shrink-0 ${
                category.active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesBar;
