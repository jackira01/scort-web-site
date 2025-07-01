'use client';

import {
  Calendar,
  CheckCircle,
  Filter,
  Grid,
  Heart,
  List,
  MapPin,
  Menu,
  Search,
  Star,
  User,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';

import { categories, profiles } from '@/modules/stories/data';

export default function EscortWebsite() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    presentado: false,
    verificado: false,
    enLinea: false,
    video: false,
    favoritos: false,
  });

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4 text-foreground">Filtros</h3>

        {/* Filter Toggles */}
        <div className="space-y-4 mb-6">
          {Object.entries({
            presentado: 'Presentado',
            verificado: 'Verificado',
            enLinea: 'En línea',
            video: 'Video',
            favoritos: 'Favoritos',
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label
                htmlFor={key}
                className="text-sm font-medium text-muted-foreground"
              >
                {label}
              </Label>
              <Switch
                id={key}
                checked={filters[key as keyof typeof filters]}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Gender Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Género</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mujer"
                className="rounded"
                defaultChecked
              />
              <label htmlFor="mujer" className="text-sm text-muted-foreground">
                Mujer
              </label>
              <Badge variant="secondary" className="ml-auto">
                23
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="trans" className="rounded" />
              <label htmlFor="trans" className="text-sm text-muted-foreground">
                Trans
              </label>
              <Badge variant="secondary" className="ml-auto">
                8
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Location Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Ubicación</h4>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bogota">Bogotá</SelectItem>
              <SelectItem value="medellin">Medellín</SelectItem>
              <SelectItem value="cali">Cali</SelectItem>
              <SelectItem value="barranquilla">Barranquilla</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Age Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Edad</h4>
          <div className="flex space-x-2">
            <Input placeholder="Min" type="number" />
            <Input placeholder="Max" type="number" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <div className="flex-shrink-0">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Online Escorts
                </h1>
              </div>
              {/* Desktop Search */}
              <div className="hidden lg:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-10 w-80 bg-muted/50 border-border focus:bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              <Select defaultValue="español">
                <SelectTrigger className="w-24 border-none bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="español">🇪🇸 ES</SelectItem>
                  <SelectItem value="english">🇺🇸 EN</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-4 w-4 mr-2" />
                Explorar
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Mi cuenta
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Cerrar sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="lg:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-full bg-muted/50 border-border focus:bg-background"
              />
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t bg-background/95 backdrop-blur py-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-4 w-4 mr-2" />
                Explorar
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                Mi cuenta
              </Button>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Cerrar sesión
              </Button>
              <div className="flex items-center justify-center pt-2">
                <Select defaultValue="español">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="español">🇪🇸 Español</SelectItem>
                    <SelectItem value="english">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Categories */}
      <div className="bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 lg:space-x-8 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`whitespace-nowrap px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-full transition-all flex-shrink-0 ${
                  category.active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            <div
              className={`grid gap-4 lg:gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-card border-border"
                >
                  <div className="relative">
                    <img
                      src={profile.image || '/placeholder.svg'}
                      alt={profile.name}
                      className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        viewMode === 'grid'
                          ? 'h-48 sm:h-56 lg:h-64'
                          : 'h-40 sm:h-48'
                      }`}
                    />
                    {profile.featured && (
                      <Badge className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                        <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                        PRESENTADO
                      </Badge>
                    )}
                    <div className="absolute top-2 lg:top-3 right-2 lg:right-3 flex space-x-1 lg:space-x-2">
                      {profile.verified && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 p-1"
                        >
                          <CheckCircle className="h-2 w-2 lg:h-3 lg:w-3" />
                        </Badge>
                      )}
                      {profile.online && (
                        <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
                      )}
                      {profile.hasVideo && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-1"
                        >
                          <Video className="h-2 w-2 lg:h-3 lg:w-3" />
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute bottom-2 lg:bottom-3 right-2 lg:right-3 bg-background/90 hover:bg-background p-2 backdrop-blur"
                    >
                      <Heart className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base lg:text-lg text-foreground group-hover:text-purple-600 transition-colors">
                          {profile.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs lg:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Edad {profile.age}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {profile.location}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {profile.height}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs lg:text-sm mb-4 line-clamp-2 lg:line-clamp-3">
                      {profile.description}
                    </p>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm">
                      Ver perfil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
