'use client';

import Loader from '@/components/Loader';
import { useProfile } from '@/hooks/use-profile';
import { ProfileGallery } from '@/modules/profileDetails/components/GaleryProfile';

// Mock data for the profile
import AudioPlayer from './AudioPlayer';
import AvailabilityProfile from './AvailabilityProfile';
import { DescriptionProfile } from './DescriptionProfile';
import PhysicalTraitsProfile from './PhysicalTraitsProfile';
import ProfielHeader from './ProfileHeader';
import RatesProfile from './RatesProfile';
import { SocialMediaProfile } from './SocialMediaProfile';
import { VerificationStatus } from './VerificationStatus';
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Perfil no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            El perfil que buscas no existe o ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  // Adaptar los datos del perfil de la API al formato esperado por los componentes
  const adaptedProfileData = {
    id: profile._id,
    name: profile.name,
    age: parseInt(profile.age),
    location: `${profile.location?.country}, ${profile.location?.state}, ${profile.location?.city}`,
    category: 'ESCORT',
    verified: profile.verification?.verificationStatus === 'verified',
    online: true,
    description: profile.description,
    images: profile.media?.gallery || ['/placeholder.svg?height=400&width=600'],
    videos: profile.media?.videos || [],
    services: profile.services || [],
    physicalTraits: {
      edad: profile.age?.toString() || '',
      ...Object.fromEntries(
        (profile.features || []).map((feature: any) => [
          feature.labelName?.toLowerCase() || feature.groupName,
          Array.isArray(feature.value) ? feature.value.join(', ') : feature.value
        ])
      ),
      ubicacion: `${profile.location?.state}, ${profile.location?.city}`,
      altura: profile.height ? `${profile.height} cm` : '',
    },
    rates: profile.rates || [],
    availability: profile.availability || {
      monday: '9:00 AM - 11:00 PM',
      tuesday: '9:00 AM - 11:00 PM',
      wednesday: '9:00 AM - 11:00 PM',
      thursday: '9:00 AM - 11:00 PM',
      friday: '24 horas',
      saturday: '24 horas',
      sunday: '2:00 PM - 10:00 PM',
    },
    contact: {
      number: profile.contact?.number || '',
      whatsapp: profile.contact?.whatsapp || false,
      telegram: profile.contact?.telegram || false,
    },
    socialMedia: {
      instagram: profile.socialMedia?.instagram || null,
      onlyfans: profile.socialMedia?.onlyfans || null,
      twitter: profile.socialMedia?.twitter || null,
      facebook: profile.socialMedia?.facebook || null,
    },
    videoUrl: '/placeholder-video.mp4',
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
            {/* Verification Status */}
            <VerificationStatus profileId={id} />
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
            <SocialMediaProfile
              contact={adaptedProfileData.contact}
              socialMedia={adaptedProfileData.socialMedia}
            />

            {/* Physical Traits */}
            <PhysicalTraitsProfile
              physicalTraits={adaptedProfileData.physicalTraits}
            />

            {/* Video Player */}
            <VideoPlayer videos={adaptedProfileData.videos} />

            {/* Audio Player */}
            <AudioPlayer audios={profile.media?.audios || []} />

            {/* Rates */}
            <RatesProfile rates={adaptedProfileData.rates} />

            {/* Availability */}
            <AvailabilityProfile
              availability={adaptedProfileData.availability}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
