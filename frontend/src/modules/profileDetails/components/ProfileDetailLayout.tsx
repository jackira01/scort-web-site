'use client';

import Loader from '@/components/Loader';
import { useProfile } from '@/hooks/use-profile';
import { ProfileGallery } from '@/modules/profileDetails/components/GaleryProfile';
import { Shield, CheckCircle } from 'lucide-react';
import { useProfileVerification } from '@/hooks/use-profile-verification';

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
  
  // Obtener datos de verificación por separado
  const { data: verification, isLoading: isVerificationLoading } = useProfileVerification(id);

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
    location: `${profile.location?.country?.label || profile.location?.country || ''}, ${profile.location?.department?.label || profile.location?.department || ''}, ${profile.location?.city?.label || profile.location?.city || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','),
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
      ubicacion: `${profile.location?.department?.label || profile.location?.department || ''}, ${profile.location?.city?.label || profile.location?.city || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','),
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
  // Función para hacer scroll a la sección de verificaciones
  const scrollToVerifications = () => {
    const verificationSection = document.getElementById('verification-section');
    if (verificationSection) {
      verificationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Verificar si fullBodyPhotos está verificado usando los datos de verificación
  const isFullBodyPhotosVerified = verification?.data?.steps?.fullBodyPhotos?.isVerified || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Verificación */}
        {isFullBodyPhotosVerified && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-in fade-in-50 slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                      La identidad de este perfil ha sido verificada
                    </h3>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Este perfil ha completado el proceso de verificación de identidad
                  </p>
                </div>
              </div>
              <button
                onClick={scrollToVerifications}
                className="text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 font-medium underline transition-colors duration-200"
              >
                ¿Qué hace a este perfil confiable?
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Left Section - 80% */}
          <div className="lg:col-span-5 space-y-8">
            {/* Gallery Section */}
            <ProfileGallery {...adaptedProfileData} />
            {/* Description and Services */}
            <DescriptionProfile
              description={adaptedProfileData.description}
              services={adaptedProfileData.services}
            />
            {/* Rates - Moved from right side */}
            <RatesProfile rates={adaptedProfileData.rates} />
            {/* Verification Status */}
            <div id="verification-section">
              <VerificationStatus profileId={id} />
            </div>
          </div>
          {/* Right Section - 20% */}
          <div className="lg:col-span-2 space-y-6">
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
