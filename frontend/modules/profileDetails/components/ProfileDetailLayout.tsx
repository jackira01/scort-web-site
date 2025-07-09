import { ProfileGallery } from '@/modules/profileDetails/components/GaleryProfile';

// Mock data for the profile
import { profileData } from '@/modules/profileDetails/data';
import AvailabilityProfile from './AvailabilityProfile';
import { DescriptionProfile } from './DescriptionProfile';
import PhysicalTraitsProfile from './PhysicalTraitsProfile';
import ProfielHeader from './ProfileHeader';
import RatesProfile from './RatesProfile';
import { SocialMediaProfile } from './SocialMediaProfile';
import VideoPlayer from './VideoPlayer';

export default function ProfileDetailLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Section - 80% */}
          <div className="lg:col-span-4 space-y-8">
            {/* Gallery Section */}
            <ProfileGallery {...profileData} />
            {/* Description and Services */}
            <DescriptionProfile
              description={profileData.description}
              services={profileData.services}
            />
          </div>
          {/* Right Section - 20% */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Header */}
            <ProfielHeader
              name={profileData.name}
              age={profileData.age}
              category={profileData.category}
            />

            {/* Social Media Buttons */}
            <SocialMediaProfile socialMediaData={profileData.socialMedia} />

            {/* Physical Traits */}
            <PhysicalTraitsProfile
              physicalTraits={profileData.physicalTraits}
            />

            {/* Video Player */}
            <VideoPlayer images={profileData.images[1]} />

            {/* Rates */}
            <RatesProfile rates={profileData.rates} />

            {/* Availability */}
            <AvailabilityProfile availability={profileData.availability} />
          </div>
        </div>
      </div>
    </div>
  );
}
