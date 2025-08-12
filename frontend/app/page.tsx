import FooterBadge from '@/components/footerBadge/FooterBadge';
import { SeedUserCache } from '@/components/SeedUserCache';
import HomeProfiles from '@/modules/catalogs/components/HomeProfiles';
import CategoriesFilter from '@/modules/filters/components/CategoriesFilter';
import FilterBar from '@/modules/filters/components/FilterBar';
import StoriesCards from '@/modules/stories/components/storiesCards';

export default async function HomePage() {
  return (
    <div className="min-h-screen dark:bg-background transition-all duration-500">
      <SeedUserCache />
      {/* <CategoriesFilter /> */}
      <FilterBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoriesCards />
        <HomeProfiles />
      </div>

      <FooterBadge />
    </div>
  );
}
