import { Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { stories } from '@/modules/stories/data';

const StoriesCards = () => {
  return (
    <div className="mb-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl lg:text-3xl font-bold  title-gradient bg-clip-text text-transparent m-0 mb-4">
        Últimas historias
      </h2>
      <div className="flex h-48 space-x-4 overflow-x-auto overflow-y-visible pb-4 scrollbar-hide items-center">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="flex-shrink-0 cursor-pointer group animate-in zoom-in-50 flex flex-col items-center"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="relative p-2">
              <div
                className={`p-1 rounded-full transition-transform duration-300 transform-gpu ${story.hasNew
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 group-hover:scale-110'
                  : 'bg-gray-300 dark:bg-gray-600 group-hover:scale-105'
                  }`}
              >
                <Avatar className="h-16 w-16 lg:h-20 lg:w-20 border-2 border-background ">
                  <AvatarImage
                    src={story.avatar || '/placeholder.svg'}
                    alt={story.user}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                    {story.user
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              {story.hasNew && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
                  <Play className="h-3 w-3 text-white fill-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground group-hover:text-foreground transition-colors duration-200 max-w-[80px] truncate">
              {story.user}
            </p>
            <p className="text-xs text-center text-muted-foreground">
              {story.timestamp}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesCards;
