import React from 'react';
import { CATEGORIES } from '@/lib/config';

interface CategoriesBarProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

const CategoriesBar = ({ selectedCategory, onCategoryChange }: CategoriesBarProps) => {
  return (
    <div className="bg-background/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 lg:space-x-8 overflow-x-auto py-4 scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.value;
            
            return (
              <button
                type="button"
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={`whitespace-nowrap px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-full transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesBar;
