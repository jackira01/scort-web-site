'use client';

import { ProfileGallery } from '@/modules/profileDetails/components/GaleryProfile';
import { useProfile } from '@/hooks/use-profile';
import Loader from '@/components/Loader';

// Mock data for the profile
import { profileData } from '@/modules/profileDetails/data';
import AvailabilityProfile from './AvailabilityProfile';
import { DescriptionProfile } from './DescriptionProfile';
import PhysicalTraitsProfile from './PhysicalTraitsProfile';
import ProfielHeader from './ProfileHeader';
import RatesProfile from './RatesProfile';
import { SocialMediaProfile } from './SocialMediaProfile';
import VideoPlayer from './VideoPlayer';

export default function ProfileDetailLayout({ id }: { id: string }) {
  const { data: profile, isLoading, error } = useProfile(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Perfil no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400">El perfil que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  // Adaptar los datos del perfil al formato esperado por los componentes
  const adaptedProfileData = {
    ...profileData, // Mantener datos mock como fallback
    name: profile.name,
    age: parseInt(profile.age),
    description: profile.description,
    images: profile.media?.gallery || profileData.images,
    videos: profile.media?.videos || [],
    physicalTraits: {
      height: profile.height,
      // Mapear features a physical traits
      ...profileData.physicalTraits
    },
    rates: profile.rates?.map((rate: any) => ({
      duration: rate.hour,
      price: rate.price,
      delivery: rate.delivery
    })) || profileData.rates,
    availability: profile.availability || profileData.availability,
    socialMedia: {
      whatsapp: profile.contact?.whatsapp ? profile.contact.number : null,
      telegram: profile.contact?.telegram ? profile.contact.number : null,
      ...profileData.socialMedia
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Section - 80% */}
          <div className="lg:col-span-4 space-y-8">
            {/* Gallery Section */}
            <ProfileGallery {...adaptedProfileData} />
            {/* Description and Services */}
            <DescriptionProfile
              description={adaptedProfileData.description}
              services={adaptedProfileData.services}
            />
          </div>
          {/* Right Section - 20% */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Header */}
            <ProfielHeader
              name={adaptedProfileData.name}
              age={adaptedProfileData.age}
              category={adaptedProfileData.category}
            />

            {/* Social Media Buttons */}
            <SocialMediaProfile socialMediaData={adaptedProfileData.socialMedia} />

            {/* Physical Traits */}
            <PhysicalTraitsProfile
              physicalTraits={adaptedProfileData.physicalTraits}
            />

            {/* Video Player */}
            <VideoPlayer images={adaptedProfileData.images[1]} />

            {/* Rates */}
            <RatesProfile rates={adaptedProfileData.rates} />

            {/* Availability */}
            <AvailabilityProfile availability={adaptedProfileData.availability} />
          </div>
        </div>
      </div>
    </div>
  );
}