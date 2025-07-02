'use client';

import { Filter, Grid, List } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import SearchProfiles from '@/modules/catalogs/components/SearchProfiles';
import AgeFilter from '@/modules/filters/components/AgeFilter';
import CategoriesBar from '@/modules/filters/components/CategoriesBar';
import FilterToglles from '@/modules/filters/components/FilterToglles';
import GenderFilter from '@/modules/filters/components/GenderFilter';
import LocationFilter from '@/modules/filters/components/LocationFIlter';
import { profiles } from '@/modules/stories/data';

export default function EscortWebsite() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4 text-foreground">Filtros</h3>

        <FilterToglles />

        <Separator className="my-6" />

        <GenderFilter />

        <Separator className="my-6" />

        <LocationFilter />

        <Separator className="my-6" />

        <AgeFilter />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Categories */}

      <CategoriesBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 space-y-6">
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6">
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button & View Controls */}
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center space-x-2 lg:space-x-4">
                {/* Mobile Filter Button */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <span className="text-muted-foreground text-sm hidden sm:block">
                  Mostrando {profiles.length} perfiles
                </span>
              </div>

              <div className="flex items-center space-x-2 lg:space-x-4">
                <Select defaultValue="relevante">
                  <SelectTrigger className="w-32 lg:w-48 text-xs lg:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevante">Lo más relevante</SelectItem>
                    <SelectItem value="reciente">Más reciente</SelectItem>
                    <SelectItem value="precio">Precio</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none px-2 lg:px-3"
                  >
                    <Grid className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none px-2 lg:px-3"
                  >
                    <List className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Profiles Grid */}

            <SearchProfiles viewMode={viewMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
