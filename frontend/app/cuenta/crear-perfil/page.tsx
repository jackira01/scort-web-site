'use client';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  DollarSign,
  Edit,
  Info,
  Lightbulb,
  MapPin,
  Mic,
  Plus,
  User,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvailabilitySchedule } from '@/components/availability/AvailabilitySchedule';
import { AttributeGroupsService, type AttributeGroup } from '@/services/attribute-groups.service';

const steps = [
  { id: 1, title: 'Lo esencial', description: 'Información básica del perfil' },
  { id: 2, title: 'Descripción', description: 'Descripción y servicios' },
  {
    id: 3,
    title: 'Detalles',
    description: 'Características físicas y contacto',
  },
  { id: 4, title: 'Multimedia', description: 'Fotos, videos y audios' },
  { id: 5, title: 'Finalizar', description: 'Revisión y publicación' },
];

const services = [
  'Atención Hombres',
  'Atención Mujeres',
  'Atención Parejas',
  'Atención Discapacitados',
  'Trato de novios',
  'Besos en la boca',
  'Beso francés',
  'Hablar sucio',
  'Fetiches',
  'Juguetes',
  'Juegos de Rol',
  'Disfraces',
  'Squirt',
  'Dejarte Lamer mis pies',
  'Besar tus pies',
  'Masajes',
  'Masajes relajantes',
  'Masaje Terapeutico',
  'Masaje cuerpo a cuerpo',
  'Masaje Tailandés',
  'Masaje Tántrico',
  'Masaje Prostático',
  'Masaje Final Feliz',
  'Videollamada erotica',
  'Videollamada con rostro',
  'Strip tease',
  'Sexting',
  'Venta audios',
  'Venta videos',
  'Venta Lencería',
  'Pack Fotos',
  'Videos Personalizados',
  'Valorar tu pene',
];

const upgradeOptions = [
  {
    id: 'presentado',
    title: 'Presentado',
    price: 250000,
    emoji: '😊',
    description:
      'Los anuncios destacados se destacan en los resultados de búsqueda y se muestran 10 veces más que los anuncios estándar.',
  },
  {
    id: 'patrocinado',
    title: 'Patrocinado',
    price: 350000,
    emoji: '😎',
    description:
      'Los anuncios patrocinados se muestran en rotación en la parte superior de la página de resultados de búsqueda.',
  },
  {
    id: 'pagina-principal',
    title: 'Página principal',
    price: 450000,
    emoji: '🤩',
    description:
      'Haga que su anuncio aparezca en nuestra página de inicio y sea visto por miles de personas.',
  },
];

export default function CreateProfilePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Step 1 - Lo esencial
    profileName: '',
    gender: '',
    workType: '',
    category: '',
    location: '',

    // Step 2 - Descripción
    description: '',
    selectedServices: [] as string[],

    // Step 3 - Detalles
    phoneNumber: '',
    age: '',
    skinColor: '',
    sexuality: '',
    eyeColor: '',
    hairColor: '',
    bodyType: '',
    height: '',
    bustSize: '',
    rates: [] as any[],
    availability: [] as Array<{
      dayOfWeek: string;
      slots: Array<{
        start: string;
        end: string;
        timezone: string;
      }>;
    }>,

    // Step 4 - Multimedia
    photos: [] as File[],
    videos: [] as File[],
    audios: [] as File[],

    // Step 5 - Finalizar
    selectedUpgrades: [] as string[],
    acceptTerms: false,
  });

  // Load attribute groups on component mount
  useEffect(() => {
    const loadAttributeGroups = async () => {
      setLoading(true);
      const groups = await AttributeGroupsService.getAttributeGroups();
      setAttributeGroups(groups);
      setLoading(false);
    };

    loadAttributeGroups();
  }, []);

  // Helper functions to get attribute options
  const getGenderOptions = () => {
    const genderGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'gender');
    return AttributeGroupsService.getActiveVariants(genderGroup);
  };

  const getCategoryOptions = () => {
    const categoryGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'category');
    return AttributeGroupsService.getActiveVariants(categoryGroup);
  };

  const getServiceOptions = () => {
    const servicesGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'services');
    return AttributeGroupsService.getActiveVariants(servicesGroup);
  };

  const getSkinColorOptions = () => {
    const skinGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'skin');
    return AttributeGroupsService.getActiveVariants(skinGroup);
  };

  const getEyeColorOptions = () => {
    const eyesGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'eyes');
    return AttributeGroupsService.getActiveVariants(eyesGroup);
  };

  const getHairColorOptions = () => {
    const hairGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'hair');
    return AttributeGroupsService.getActiveVariants(hairGroup);
  };

  const getSexualityOptions = () => {
    const sexGroup = AttributeGroupsService.getAttributeGroupByKey(attributeGroups, 'sex');
    return AttributeGroupsService.getActiveVariants(sexGroup);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter((s) => s !== service)
        : [...prev.selectedServices, service],
    }));
  };

  const handleUpgradeToggle = (upgradeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedUpgrades: prev.selectedUpgrades.includes(upgradeId)
        ? prev.selectedUpgrades.filter((u) => u !== upgradeId)
        : [...prev.selectedUpgrades, upgradeId],
    }));
  };

  const getSidebarContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Consejo rápido
                </h3>
                <Edit className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Incrementa las visitas a tu sitio con un nombre y título super
                atrayente !
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Consejos
                </h3>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Sé honesto y auténtico en tu descripción</li>
                <li>• Menciona tus mejores cualidades</li>
                <li>• Usa un lenguaje profesional</li>
                <li>• Especifica claramente tus servicios</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Prohibido
                </h3>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Contenido explícito o vulgar</li>
                <li>• Información falsa o engañosa</li>
                <li>• Servicios ilegales</li>
                <li>• Discriminación de cualquier tipo</li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Información importante
                </h3>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Tu número de teléfono será privado</li>
                <li>• Solo se mostrará parcialmente</li>
                <li>
                  • Los clientes podrán contactarte a través de la plataforma
                </li>
                <li>• Puedes cambiar tu disponibilidad en cualquier momento</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Recomendaciones
                </h3>
                <Edit className="h-3 w-3 text-blue-600" />
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>
                  • Sube tus mejores fotos y videos, se pueden redimensionar o
                  recortar una vez subidas.
                </li>
                <li>
                  • Sube fotos y videos bien iluminados, no tienen que ser
                  profesionales, pero sí con luz de frente y buena resolución.
                </li>
                <li>
                  • Si necesitas ocultar tu rostro púdelo, no lo ocultes con
                  emojis o adornos.
                </li>
                <li>
                  • Agrega una foto de portada a tus videos. Puedes subir
                  fotos/videos con otras personas, pero no se les puede ver la
                  cara.
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Restricciones
                </h3>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• No agregues fotos/videos que no son tuyos.</li>
                <li>• No añadas texto a tus fotos/videos.</li>
                <li>
                  • No se pueden subir fotos con niños/as o ambientes infantiles
                  o que sugieran relaciones con niños/as.
                </li>
                <li>
                  • No se pueden subir fotos con animales o que sugieran
                  relaciones con ellos.
                </li>
                <li>• No subas dibujos o imágenes generadas por IA.</li>
                <li>
                  • No subas collages (unión de varias fotos en una), sube las
                  fotos de una en una en lugar de unirlas.
                </li>
                <li>• Si se detectan fotos repetidas se eliminarán.</li>
                <li>• Sube solo fotos/videos con logos de otras webs.</li>
                <li>
                  • Fotos/videos que incumplan los límites aquí descritos se
                  eliminarán o incluso pueden hacer que se vete el perfil.
                </li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Consejo rápido
                </h3>
                <Edit className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Escoge el plan que más se adapte a tu necesidad y flujo de
                ingresos. Recuerda que adicionalmente hay un Boost (impulso) que
                puede subir tu perfil a los primeros lugares durante 24 horas.
                RECUERDA que te contactaremos para verificar tu perfil y tus
                fotos, incluyendo diferentes imágenes en tu perfil de acuerdo al
                nivel de verificación, insignia que le dará mayor confianza a
                tus potenciales clientes.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                01
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Crear un nuevo perfil
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="profileName" className="text-foreground">
                  Cree un nombre para mostrar para su perfil.{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="profileName"
                  placeholder="Sexy Jane"
                  value={formData.profileName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      profileName: e.target.value,
                    }))
                  }
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-foreground">
                    Mi género es <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex space-x-2 mt-2">
                    {getGenderOptions().map((gender) => (
                      <Button
                        key={gender}
                        variant={
                          formData.gender === gender ? 'default' : 'outline'
                        }
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, gender }))
                        }
                        className={
                          formData.gender === gender
                            ? 'bg-green-600 hover:bg-green-700'
                            : ''
                        }
                      >
                        {formData.gender === gender && (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {gender}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">trabajo para</Label>
                  <div className="flex space-x-2 mt-2">
                    {['Yo mismo (independiente)', 'Agencia'].map((type) => (
                      <Button
                        key={type}
                        variant={
                          formData.workType === type ? 'default' : 'outline'
                        }
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, workType: type }))
                        }
                        className={
                          formData.workType === type
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : ''
                        }
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-foreground">
                  ¿Dónde quieres que se muestre tu anuncio?{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">Seleccionar categoría</option>
                  {getCategoryOptions().map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-foreground">
                  ¿Dónde te encuentras? <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Cambio</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                02
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Descripción
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="description" className="text-foreground">
                    Acerca de mí <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.description.length} / 1000 caracteres restantes
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Cuéntanos sobre ti, tus intereses, personalidad y lo que te hace especial..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-32"
                  maxLength={1000}
                />
              </div>

              <div>
                <Label className="text-foreground text-lg font-semibold mb-4 block">
                  Servicios
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getServiceOptions().map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={formData.selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                      />
                      <Label
                        htmlFor={service}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                03
              </div>
              <h2 className="text-2xl font-bold text-foreground">Detalles</h2>
            </div>

            <div className="space-y-6">
              {/* Rates Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Mis tarifas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">gestionar</p>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Section */}
              <AvailabilitySchedule
                availability={formData.availability}
                onChange={(newAvailability) =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: newAvailability,
                  }))
                }
              />

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Número de contacto
                  </Label>
                  <div className="flex mt-2">
                    <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                      <span className="text-sm">🇨🇴</span>
                    </div>
                    <Input
                      id="phone"
                      placeholder="+57 300 123 4567"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="age" className="text-foreground">
                    Edad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="23"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, age: e.target.value }))
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Physical Characteristics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-foreground">Piel</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSkinColorOptions().map((color) => (
                      <Button
                        key={color}
                        variant={
                          formData.skinColor === color ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, skinColor: color }))
                        }
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Sexo</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getSexualityOptions().map((sexuality) => (
                        <Button
                          key={sexuality}
                          variant={
                            formData.sexuality === sexuality
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, sexuality }))
                          }
                        >
                          {sexuality}
                        </Button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Appearance Details */}
              <div>
                <Label className="text-foreground text-lg font-semibold mb-4 block">
                  ¿Cómo me veo?
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-foreground">Ojos</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Negros', 'Café', 'Avellana', 'Verdes', 'Azul'].map(
                        (color) => (
                          <Button
                            key={color}
                            variant={
                              formData.eyeColor === color
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                eyeColor: color,
                              }))
                            }
                          >
                            {color}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground">Pelo</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        'Negro',
                        'Castaño Claro',
                        'Castaño Oscuro',
                        'Rubio',
                        'Pelirrojo',
                        'Canoso',
                      ].map((color) => (
                        <Button
                          key={color}
                          variant={
                            formData.hairColor === color ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              hairColor: color,
                            }))
                          }
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground">Cuerpo</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        'Curvy',
                        'Delgado',
                        'Atlético',
                        'Promedio',
                        'Voluptuoso',
                        'Rellenito/a',
                        'Gordibuen@/a',
                      ].map((type) => (
                        <Button
                          key={type}
                          variant={
                            formData.bodyType === type ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, bodyType: type }))
                          }
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="height" className="text-foreground">
                      Altura
                    </Label>
                    <Input
                      id="height"
                      placeholder="173 cm"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <Label htmlFor="cuerpo" className="text-foreground">
                      Cuerpo
                    </Label>
                    <Input
                      id="cuerpo"
                      placeholder="Descripción del cuerpo"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bustSize" className="text-foreground">
                      Talla del busto
                    </Label>
                    <Input
                      id="bustSize"
                      placeholder="COPA_D"
                      value={formData.bustSize}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bustSize: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                04
              </div>
              <h2 className="text-2xl font-bold text-foreground">Multimedia</h2>
            </div>

            <div className="space-y-6">
              {/* Photos Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-foreground">Mis fotos</CardTitle>
                    <Badge variant="outline">0 / 20</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">añadir nuevo</p>
                  </div>
                </CardContent>
              </Card>

              {/* Videos Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-foreground">
                      Mis videos
                    </CardTitle>
                    <Badge variant="outline">0 / 8</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">añadir nuevo</p>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-foreground">
                      Mis archivos de audio
                    </CardTitle>
                    <Badge variant="outline">0 / 6</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">añadir nuevo</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                05
              </div>
              <h2 className="text-2xl font-bold text-foreground">Finalizar</h2>
            </div>

            <div className="space-y-6">
              {/* Upgrade Options */}
              <div>
                <Label className="text-foreground text-lg font-semibold mb-4 block">
                  Actualizaciones
                </Label>
                <div className="space-y-4">
                  {upgradeOptions.map((option) => (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        formData.selectedUpgrades.includes(option.id)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'hover:border-purple-300'
                      }`}
                      onClick={() => handleUpgradeToggle(option.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={formData.selectedUpgrades.includes(
                                option.id,
                              )}
                              onChange={() => handleUpgradeToggle(option.id)}
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{option.emoji}</span>
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {option.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              ${option.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Creado</span>
                      <p className="text-foreground font-medium">Justo ahora</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Fecha de caducidad
                      </span>
                      <p className="text-foreground font-medium">Nunca</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Puntos de vista
                      </span>
                      <p className="text-foreground font-medium">0</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado</span>
                      <p className="text-foreground font-medium">
                        Aprobación pendiente
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <Label className="text-foreground text-lg font-semibold">
                  Términos & Condiciones
                </Label>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceptTerms: !!checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    I accept the website{' '}
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:underline"
                    >
                      terms & conditions
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      privacy policy
                    </Link>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen mb-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted/50 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  Crear Nuevo Perfil
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white">
                🟢 NICOLAS ALVAREZ
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Guidelines */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {getSidebarContent()}

              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3"
                onClick={() => {
                  // Save draft functionality
                  console.log('Guardando borrador...');
                }}
              >
                Guardar
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-background rounded-xl shadow-sm border border-border p-8">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="hover:bg-muted/50 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>

                {currentStep === 5 ? (
                  <Button
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                    disabled={!formData.acceptTerms}
                  >
                    Guardar
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center space-x-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-200 ${
                  currentStep === step.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : currentStep > step.id
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {currentStep > step.id ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden sm:block font-medium">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-20 right-4 z-50">
        <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg">
          🟢 NICOLAS ALVAREZ
        </Badge>
      </div>
    </div>
  );
}
