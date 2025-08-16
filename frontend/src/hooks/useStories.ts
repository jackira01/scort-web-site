import { useState, useEffect } from 'react';

interface Story {
  link: string;
  type: 'image' | 'video';
  timestamp?: string;
}

interface ProfileWithStories {
  _id: string;
  name: string;
  media?: {
    gallery?: string[];
    videos?: string[];
    audios?: string[];
    stories?: Story[];
  };
  stories: Story[];
  hasNewStories: boolean;
}

export const useStories = () => {
  const [profilesWithStories, setProfilesWithStories] = useState<ProfileWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoriesFromProfiles = async () => {
      try {
        setLoading(true);
        // TODO: Reemplazar con llamada real a la API
        // const response = await fetch('/api/profiles/stories');
        // const data = await response.json();
        
        // Datos de ejemplo mientras se implementa la API
        const mockData: ProfileWithStories[] = [
          {
            _id: '1',
            name: 'Sofia Martinez',
            media: {
              gallery: ['/placeholder.svg?height=60&width=60']
            },
            stories: [
              { link: '/placeholder.svg?height=400&width=300', type: 'image', timestamp: '2h' },
              { link: '/placeholder.svg?height=400&width=300', type: 'video', timestamp: '1h' }
            ],
            hasNewStories: true
          },
          {
            _id: '2',
            name: 'Isabella Rodriguez',
            media: {
              gallery: ['/placeholder.svg?height=60&width=60']
            },
            stories: [
              { link: '/placeholder.svg?height=400&width=300', type: 'image', timestamp: '4h' }
            ],
            hasNewStories: true
          },
          {
            _id: '3',
            name: 'Camila Torres',
            media: {
              gallery: ['/placeholder.svg?height=60&width=60']
            },
            stories: [
              { link: '/placeholder.svg?height=400&width=300', type: 'image', timestamp: '1d' }
            ],
            hasNewStories: false
          }
        ];
        
        setProfilesWithStories(mockData);
        setError(null);
      } catch (err) {
        setError('Error al cargar las historias');
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesFromProfiles();
  }, []);

  return {
    profilesWithStories,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-ejecutar la lógica de fetch
    }
  };
};