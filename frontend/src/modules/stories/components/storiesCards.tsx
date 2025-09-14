'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';
import StoriesModal from '@/components/modals/StoriesModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfilesWithStories } from '@/hooks/use-profiles-with-stories';

const StoriesCards = () => {
  const { data, isLoading: loading, error } = useProfilesWithStories(1, 20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);

  // Transformar los datos de la API al formato esperado por el modal
  const profilesWithStories = data?.profiles?.map(profile => ({
    _id: profile._id,
    name: profile.name,
    media: profile.media,
    stories: profile.media?.stories || [],
    hasNewStories: (profile.media?.stories?.length || 0) > 0
  })) || [];

  const handleStoryClick = (profileIndex: number) => {
    setSelectedProfileIndex(profileIndex);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl lg:text-3xl font-bold title-gradient bg-clip-text text-transparent m-0 mb-4">
          Últimas historias
        </h2>
        <div className="flex h-48 space-x-4 overflow-x-auto overflow-y-visible pb-4 scrollbar-hide items-center">
          {[...Array(3)].map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex-shrink-0 animate-pulse flex flex-col items-center"
            >
              <div className="w-24 h-24 lg:w-28 lg:h-28 bg-gray-300 dark:bg-gray-600 rounded-full mb-2" />
              <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || profilesWithStories.length === 0) {
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl lg:text-3xl font-bold title-gradient bg-clip-text text-transparent m-0 mb-4">
          Últimas historias
        </h2>
        <p className="text-muted-foreground">
          No hay historias disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl lg:text-3xl font-bold title-gradient bg-clip-text text-transparent m-0 mb-4">
        Últimas historias
      </h2>
      <div className="flex h-48 space-x-4 overflow-x-auto overflow-y-visible pb-4 scrollbar-hide items-center">
        {profilesWithStories.map((profile, index) => (
          <button
            type="button"
            key={profile._id}
            className="flex-shrink-0 cursor-pointer group flex flex-col items-center border-0 bg-transparent p-0"
            style={{ animationDelay: `${index * 150}ms` }}
            onClick={() => handleStoryClick(index)}
          >
            <div className="relative p-2">
              <div
                className={`p-1 rounded-full transition-transform duration-300 transform-gpu ${profile.hasNewStories
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 group-hover:scale-110'
                  : 'bg-gray-300 dark:bg-gray-600 group-hover:scale-105'
                  }`}
              >
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-background">
                  <img
                    src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {profile.hasNewStories && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
                  <Play className="h-3 w-3 text-white fill-white" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-center mt-2 text-muted-foreground group-hover:text-foreground transition-colors duration-200 max-w-[90px] truncate">
              {profile.name}
            </p>
          </button>
        ))}
      </div>

      {/* Stories Modal */}
      <StoriesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profiles={profilesWithStories}
        initialProfileIndex={selectedProfileIndex}
      />
    </div>
  );
};

export default StoriesCards;
