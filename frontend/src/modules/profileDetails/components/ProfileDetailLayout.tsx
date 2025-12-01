'use client';

import Loader from '@/components/Loader';
import { useProfile } from '@/hooks/use-profile';
import { ProfileGallery } from '@/modules/profileDetails/components/GaleryProfile';
import { useProfileVerification } from '@/hooks/use-profile-verification';
import { useSession } from 'next-auth/react';
import { createProfileSlug } from '@/utils/slug';

import AudioPlayer from './AudioPlayer';
import AvailabilityProfile from './AvailabilityProfile';
import { DescriptionProfile } from './DescriptionProfile';
import PhysicalTraitsProfile from './PhysicalTraitsProfile';
import ProfielHeader from './ProfileHeader';
import RatesProfile from './RatesProfile';
import { ShareProfile } from './ShareProfile';
import { SocialMediaProfile } from './SocialMediaProfile';
import { VerificationStatus } from './VerificationStatus';
import VideoPlayer from './VideoPlayer';
import { AccountTypeSection } from './AccountTypeSection';

export default function ProfileDetailLayout({ id }: { id: string }) {
  const { data: session } = useSession();
  const { data: profile, isLoading, error } = useProfile(id);
  const { data: verification } = useProfileVerification(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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

  const isAdmin = session?.user?.role === 'admin';
  const isOwner = session?.user?.id === profile.user?._id;
  const isVisible = profile.visible;

  if (!isVisible && !isAdmin && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Perfil no disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Este perfil no está disponible públicamente.
          </p>
        </div>
      </div>
    );
  }

  const adaptedProfileData = {
    id: profile._id,
    name: profile.name,
    age: parseInt(profile.age),
    location: `${profile.location?.country?.label || profile.location?.country || ''}, ${profile.location?.department?.label || profile.location?.department || ''}, ${profile.location?.city?.label || profile.location?.city || ''}`
      .replace(/^,\s*|,\s*$/g, '')
      .replace(/,\s*,/g, ','),
    category: (() => {
      const cat = profile.features?.find((feature: any) => feature.groupName === 'Categoría');
      if (!cat) return 'ESCORT';
      const v = Array.isArray(cat.value) ? cat.value[0] : cat.value;
      if (v && typeof v === 'object' && 'label' in v) return (v as any).label;
      return v || 'ESCORT';
    })(),
    verified: profile.verification?.verificationStatus === 'verified',
    description: profile.description,
    images: profile.media?.gallery || ['/placeholder.svg?height=400&width=600'],
    videos: (() => {
      const vids = profile.media?.videos || [];
      const cover = (profile as any).coverImageIndex;
      const previewFallback =
        profile.media?.gallery?.length > 0
          ? (typeof cover === 'number' && profile.media.gallery[cover]) ||
          profile.media.gallery[0]
          : '/placeholder.svg';
      return vids.map((v: any) =>
        typeof v === 'string'
          ? { link: v, preview: previewFallback }
          : {
            link: v.link || '',
            preview:
              v.preview && v.preview.trim() !== ''
                ? v.preview
                : previewFallback,
          }
      );
    })(),
    services: profile.services || [],
    basicServices: profile.basicServices || [],
    additionalServices: profile.additionalServices || [],
    physicalTraits: {
      edad: profile.age?.toString() || '',
      ...Object.fromEntries(
        (profile.features || []).map((feature: any) => {
          const values: any[] = Array.isArray(feature.value)
            ? feature.value
            : [feature.value];
          const display = values
            .filter((v: any) => v != null)
            .map((v: any) =>
              typeof v === 'object' && 'label' in v ? v.label : v
            )
            .join(', ');
          return [
            feature.labelName?.toLowerCase() || feature.groupName,
            display,
          ];
        })
      ),
      ubicacion: `${profile.location?.department?.label || profile.location?.department || ''}, ${profile.location?.city?.label || profile.location?.city || ''}`
        .replace(/^,\s*|,\s*$/g, '')
        .replace(/,\s*,/g, ','),
      altura: profile.height ? `${profile.height} cm` : '',
    },
    rates: profile.rates || [],
    availability: profile.availability || {},
    contact: {
      number: profile.contact?.number || '',
      whatsapp: profile.contact?.whatsapp || false,
      telegram: profile.contact?.telegram || false,
    },
    socialMedia: {
      instagram: profile.socialMedia?.instagram || null,
      onlyfans: profile.socialMedia?.onlyFans || null,
      twitter: profile.socialMedia?.twitter || null,
      facebook: profile.socialMedia?.facebook || null,
      tiktok: profile.socialMedia?.tiktok || null,
    },
    accountType: (profile.user as any)?.accountType || 'common',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* === Contenido principal === */}
          <div className="lg:col-span-5 space-y-8">
            <ProfileGallery
              {...adaptedProfileData}
              isIdentityVerified={
                (verification?.data?.steps?.frontPhotoVerification?.isVerified || false) &&
                (verification?.data?.steps?.selfieVerification?.isVerified || false)
              }
            />

            {/* Header + redes sociales solo en mobile */}
            <div className="block lg:hidden space-y-4 px-0">
              <ProfielHeader
                name={adaptedProfileData.name}
                age={adaptedProfileData.age}
                category={adaptedProfileData.category}
              />
              <SocialMediaProfile
                contact={adaptedProfileData.contact}
                socialMedia={adaptedProfileData.socialMedia}
              />

              <AccountTypeSection accountType={adaptedProfileData.accountType} />

              {/* Compartir perfil en móvil */}
              <ShareProfile
                profileName={adaptedProfileData.name}
                profileUrl={typeof window !== 'undefined' ? `${window.location.origin}/perfil/${createProfileSlug(adaptedProfileData.name, adaptedProfileData.id)}` : ''}
              />
            </div>

            <DescriptionProfile
              description={adaptedProfileData.description}
              services={adaptedProfileData.services}
              basicServices={adaptedProfileData.basicServices}
              additionalServices={adaptedProfileData.additionalServices}
            />

            <VideoPlayer videos={adaptedProfileData.videos} />

            <div id="verification-section">
              <VerificationStatus profileId={id} />
            </div>
          </div>

          {/* === Sidebar === */}
          <aside className="lg:col-span-2 space-y-6">
            {/* Header + redes en desktop */}
            <div className="hidden lg:block space-y-4">
              <ProfielHeader
                name={adaptedProfileData.name}
                age={adaptedProfileData.age}
                category={adaptedProfileData.category}
              />
              <SocialMediaProfile
                contact={adaptedProfileData.contact}
                socialMedia={adaptedProfileData.socialMedia}
              />

              <AccountTypeSection accountType={adaptedProfileData.accountType} />

              {/* Compartir perfil */}
              <ShareProfile
                profileName={adaptedProfileData.name}
                profileUrl={typeof window !== 'undefined' ? `${window.location.origin}/perfil/${createProfileSlug(adaptedProfileData.name, adaptedProfileData.id)}` : ''}
              />
            </div>

            <PhysicalTraitsProfile
              physicalTraits={adaptedProfileData.physicalTraits}
            />

            {/* RatesProfile movido al sidebar */}
            <RatesProfile rates={adaptedProfileData.rates} />

            <AudioPlayer audios={profile.media?.audios || []} />
            <AvailabilityProfile
              availability={adaptedProfileData.availability}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
