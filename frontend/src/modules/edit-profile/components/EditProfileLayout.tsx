'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAttributeGroups } from '@/hooks/use-attribute-groups';
import { useProfile } from '@/hooks/use-profile';
import { updateProfile } from '@/services/user.service';
import {
  uploadMultipleAudios,
  uploadMultipleImages,
  uploadMultipleVideos,
} from '@/utils/tools';
import { FormProvider } from '../../create-profile/context/FormContext';
import { editSteps } from '../data';
import type { FormData } from '../../create-profile/schemas';
import { normalizeSimpleText } from '@/utils/normalize-text';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from '../../create-profile/schemas';
import type { AttributeGroup, Rate } from '../../create-profile/types';
import { SidebarContent } from '../../create-profile/components/SidebarContent';
import { Step1EssentialInfo } from '../../create-profile/components/Step1EssentialInfo';
import { Step2Description } from '../../create-profile/components/Step2Description';
import { Step3Details } from '../../create-profile/components/Step3Details';
import { Step5Multimedia } from '../../create-profile/components/Step5Multimedia';
import { Step4Plan } from '../../create-profile/components/Step4Plan';

interface EditProfileLayoutProps {
  profileId: string;
}

export function EditProfileLayout({ profileId }: EditProfileLayoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Obtener datos del perfil existente
  const { data: profileDetails, isLoading: isLoadingProfile, error: profileError } = useProfile(profileId);
  const { data: attributeGroups, isLoading: isLoadingAttributes, error: attributesError } = useAttributeGroups();

  const form = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      // Step 1 - Lo esencial
      profileName: '',
      gender: '',
      category: '',
      location: {
        country: 'Colombia',
        department: '',
        city: '',
      },

      // Step 2 - Descripción
      description: '',
      selectedServices: [],

      // Step 3 - Detalles
      contact: {
        number: '',
        whatsapp: '',
        telegram: '',
      },
      age: '',
      skinColor: '',
      sexuality: '',
      eyeColor: '',
      hairColor: '',
      bodyType: '',
      height: '',
      rates: [] as Rate[],
      availability: [],

      // Step 4 - Multimedia
      photos: [],
      videos: [],
      audios: [],

      // Step 5 - Finalizar
      selectedUpgrades: [],
      acceptTerms: false,
    },
  });

  // Llenar el formulario con los datos del perfil existente
  useEffect(() => {
    if (profileDetails && attributeGroups) {
      // Cargando datos del perfil

      // Función para obtener el valor de una característica por grupo
      const getFeatureValue = (groupKey: string) => {
        // Mapeo de claves a nombres de grupo en español
        const groupNameMap: Record<string, string[]> = {
          'skin': ['Color de piel', 'Piel'],
          // 'sex': ['sexo', 'Orientación sexual', 'Sexualidad'], // REMOVIDO
          'eyes': ['Color de ojos', 'Ojos'],
          'hair': ['Color de cabello', 'Cabello', 'Pelo'],
          'body': ['Cuerpo', 'Tipo de cuerpo', 'Contextura', 'contextura'],
        };

        const possibleNames = groupNameMap[groupKey] || [groupKey];

        const feature = profileDetails.features?.find((f: any) => {
          const groupName = f.groupName?.toLowerCase() || '';
          const matches = possibleNames.some(name =>
            groupName.includes(name.toLowerCase()) ||
            name.toLowerCase().includes(groupName)
          );
          return matches;
        });

        const value = feature?.value?.[0] || '';

        // Para bodyType, si no se encuentra la característica, devolver cadena vacía
        // Esto permite que perfiles sin esta característica puedan editarla
        if (groupKey === 'body' && !value) {
          return '';
        }

        return value;
      };

      // Función específica para obtener el género
      const getGenderValue = () => {
        // Buscar por groupName que contenga género
        const genderFeature = profileDetails.features?.find((f: any) =>
          f.groupName?.toLowerCase().includes('género') ||
          f.groupName?.toLowerCase().includes('genero') ||
          ['hombre', 'mujer', 'trans'].includes(f.value?.[0]?.toLowerCase())
        );
        const value = genderFeature?.value?.[0] || '';
        return value;
      };

      // Función específica para obtener la categoría
      const getCategoryValue = () => {
        // Buscar por groupName que contenga categoría
        const categoryFeature = profileDetails.features?.find((f: any) =>
          f.groupName?.toLowerCase().includes('categoría') ||
          f.groupName?.toLowerCase().includes('categoria') ||
          f.groupName?.toLowerCase().includes('escort') ||
          f.groupName?.toLowerCase().includes('agencia')
        );
        const value = categoryFeature?.value?.[0] || categoryFeature?.groupName || profileDetails.category || '';
        return value;
      };

      // Validar que los valores extraídos no estén vacíos
      const validateFeatureValue = (value: string, fieldName: string) => {
        if (!value || value.trim() === '') {
          // Campo está vacío o no válido
          return '';
        }
        return value;
      };

      // Obtener servicios seleccionados
      const getSelectedServices = () => {
        const servicesFeature = profileDetails.features?.find((f: any) =>
          f.group?.key === 'services'
        );
        return servicesFeature?.value || [];
      };

      // Convertir rates del backend al formato del formulario
      const convertRates = () => {

        if (!profileDetails.rates || !Array.isArray(profileDetails.rates)) {
          return [];
        }

        const convertedRates = profileDetails.rates
          .filter((rate: any) => rate && typeof rate === 'object' && Object.keys(rate).length > 0)
          .map((rate: any, index: number) => {
            const converted = {
              id: rate.id || rate._id || `rate-${index}`,
              time: rate.hour || rate.time || '',
              price: typeof rate.price === 'number' ? rate.price : parseFloat(rate.price) || 0,
              delivery: Boolean(rate.delivery),
            };
            return converted;
          });

        return convertedRates;
      };

      // Actualizar valores del formulario usando setValue para mejor control
      const formData = {
        profileName: profileDetails.name || '',
        gender: getGenderValue(),
        category: getCategoryValue(),
        location: {
          country: profileDetails.location?.country?.label || profileDetails.location?.country || 'Colombia',
          department: profileDetails.location?.department?.label || profileDetails.location?.department || '',
          city: profileDetails.location?.city?.label || profileDetails.location?.city || '',
        },
        description: profileDetails.description || '',
        selectedServices: getSelectedServices(),
        contact: {
          number: profileDetails.contact?.number || '',
          whatsapp: profileDetails.contact?.whatsapp || '',
          telegram: profileDetails.contact?.telegram || '',
        },
        age: profileDetails.age ? String(profileDetails.age) : '',
        skinColor: getFeatureValue('skin'),
        eyeColor: getFeatureValue('eyes'),
        hairColor: getFeatureValue('hair'),
        bodyType: getFeatureValue('body'),
        height: profileDetails.height ? String(profileDetails.height) : '',
        rates: convertRates(),
        availability: profileDetails.availability || [],
        photos: profileDetails.media?.gallery || [],
        videos: profileDetails.media?.videos || [],
        audios: profileDetails.media?.audios || [],
        socialMedia: {
          instagram: profileDetails.socialMedia?.instagram || '',
          facebook: profileDetails.socialMedia?.facebook || '',
          tiktok: profileDetails.socialMedia?.tiktok || '',
          twitter: profileDetails.socialMedia?.twitter || '',
          onlyFans: profileDetails.socialMedia?.onlyFans || '',
        },
        selectedUpgrades: [],
        acceptTerms: true, // Ya aceptó términos al crear el perfil
      };

      // Establecer cada valor individualmente para asegurar que los campos controlados se actualicen
      // Step 1 - Campos esenciales
      form.setValue('profileName', formData.profileName);
      form.setValue('gender', formData.gender);
      form.setValue('category', formData.category);
      form.setValue('location.country', formData.location.country);
      form.setValue('location.department', formData.location.department);
      form.setValue('location.city', formData.location.city);

      // Step 2 - Descripción y servicios
      form.setValue('description', formData.description);

      // Calcular selectedServices como la unión de basicServices y additionalServices
      const allServices = [
        ...(profileDetails.basicServices || []),
        ...(profileDetails.additionalServices || [])
      ];
      const uniqueServices = [...new Set(allServices)]; // Eliminar duplicados

      form.setValue('selectedServices', uniqueServices);
      form.setValue('basicServices', profileDetails.basicServices || []);
      form.setValue('additionalServices', profileDetails.additionalServices || []);

      // Step 3 - Detalles y contacto
      form.setValue('contact.number', formData.contact.number);
      form.setValue('contact.whatsapp', formData.contact.whatsapp);
      form.setValue('contact.telegram', formData.contact.telegram);
      form.setValue('age', formData.age);
      form.setValue('skinColor', formData.skinColor);
      form.setValue('eyeColor', formData.eyeColor);
      form.setValue('hairColor', formData.hairColor);
      form.setValue('bodyType', formData.bodyType);
      form.setValue('height', formData.height);
      form.setValue('rates', formData.rates);
      form.setValue('availability', formData.availability);

      // Social Media
      form.setValue('socialMedia.instagram', formData.socialMedia.instagram);
      form.setValue('socialMedia.facebook', formData.socialMedia.facebook);
      form.setValue('socialMedia.tiktok', formData.socialMedia.tiktok);
      form.setValue('socialMedia.twitter', formData.socialMedia.twitter);
      form.setValue('socialMedia.onlyFans', formData.socialMedia.onlyFans);

      // Step 4 - Multimedia
      form.setValue('photos', formData.photos);
      form.setValue('videos', formData.videos);
      form.setValue('audios', formData.audios);

      // Step 5 - Finalizar
      form.setValue('selectedUpgrades', formData.selectedUpgrades);
      form.setValue('acceptTerms', formData.acceptTerms);

      // Forzar re-render de los campos controlados
      form.trigger();

      // Valores establecidos en el formulario
    }
  }, [profileDetails, attributeGroups]);

  const acceptTerms = form.watch('acceptTerms');

  // Crear un map para lookup O(1)
  const groupMap = useMemo(() => {
    return Object.fromEntries(
      ((attributeGroups as AttributeGroup[]) || []).map((g: AttributeGroup) => [
        g.key,
        g,
      ]),
    );
  }, [attributeGroups]);

  const validateStep = (step: number) => {
    form.clearErrors();

    try {
      switch (step) {
        case 1: {
          const step1Data = {
            profileName: form.getValues('profileName') || '',
            gender: form.getValues('gender') || '',
            category: form.getValues('category') || '',
            location: {
              country: 'Colombia',
              department: form.getValues('location.department') || '',
              city: form.getValues('location.city') || '',
            },
          };
          return step1Schema.safeParse(step1Data);
        }

        case 2: {
          const step2Data = {
            description: form.getValues('description') || '',
            selectedServices: form.getValues('selectedServices') || [],
            basicServices: form.getValues('basicServices') || [],
            additionalServices: form.getValues('additionalServices') || [],
          };

          const validation = step2Schema.safeParse(step2Data);

          return validation;
        }

        case 3: {
          const contactData = form.getValues('contact') || {
            number: '',
            whatsapp: '',
            telegram: '',
          };
          const ageValue = form.getValues('age');
          const step3Data = {
            contact: {
              number: contactData.number || '',
              whatsapp: contactData.whatsapp || undefined,
              telegram: contactData.telegram || undefined,
            },
            age: ageValue && ageValue !== '' ? ageValue : undefined,
            skinColor: form.getValues('skinColor') || '',
            sexuality: form.getValues('sexuality') || '',
            eyeColor: form.getValues('eyeColor') || '',
            hairColor: form.getValues('hairColor') || '',
            bodyType: form.getValues('bodyType') || '',
            height: form.getValues('height') || '',
            rates: form.getValues('rates') || [],
            availability: form.getValues('availability') || [],
          };

          const validation = step3Schema.safeParse(step3Data);

          return validation;
        }

        case 4: {
          // Validamos multimedia en paso 4 (sin plan selection)
          const step4Data = {
            photos: form.getValues('photos') || [],
            videos: form.getValues('videos') || [],
            audios: form.getValues('audios') || [],
          };
          return step4Schema.safeParse(step4Data);
        }

        default:
          return { success: false, error: { issues: [] } };
      }
    } catch (error) {
      // Validation error
      return { success: false, error: { issues: [] } };
    }
  };

  const transformDataToBackendFormat = (
    formData: FormData & {
      photos?: string[];
      videos?: string[];
      audios?: string[];
    },
  ) => {
    const features = [];

    // Gender feature
    if (formData.gender && groupMap.gender?._id) {
      features.push({
        group_id: groupMap.gender._id,
        value: [formData.gender],
      });
    }

    // Hair color feature
    if (formData.hairColor && groupMap.hair?._id) {
      features.push({
        group_id: groupMap.hair._id,
        value: [formData.hairColor],
      });
    }

    // Eye color feature
    if (formData.eyeColor && groupMap.eyes?._id) {
      features.push({
        group_id: groupMap.eyes._id,
        value: [formData.eyeColor],
      });
    }

    // Skin color
    if (formData.skinColor && groupMap.skin?._id) {
      features.push({
        group_id: groupMap.skin._id,
        value: [formData.skinColor],
      });
    }

    // Body type feature
    if (formData.bodyType && groupMap.body?._id) {
      features.push({
        group_id: groupMap.body._id,
        value: [formData.bodyType],
      });
    }

    // Sexuality - REMOVIDO
    // if (formData.sexuality && groupMap.sex?._id) {
    //   features.push({
    //     group_id: groupMap.sex._id,
    //     value: [formData.sexuality],
    //   });
    // }

    // Category feature
    if (formData.category && groupMap.category?._id) {
      features.push({
        group_id: groupMap.category._id,
        value: [formData.category],
      });
    }

    // Services
    if (formData.selectedServices && groupMap.services?._id) {
      features.push({
        group_id: groupMap.services._id,
        value: formData.selectedServices,
      });
    }

    const rates = formData.rates?.map((rate) => ({
      hour: rate.time,
      price: rate.price,
      delivery: rate.delivery,
    }));

    return {
      user: session?.user?._id,
      name: formData.profileName,
      description: formData.description,
      location: {
        country: {
          value: 'colombia',
          label: 'Colombia'
        },
        department: {
          value: formData.location.department ? normalizeSimpleText(formData.location.department) : '',
          label: formData.location.department || ''
        },
        city: {
          value: formData.location.city ? normalizeSimpleText(formData.location.city) : '',
          label: formData.location.city || ''
        }
      },
      features,
      age: formData.age,
      contact: formData.contact,
      height: formData.height,
      // Nuevos campos de servicios clasificados
      basicServices: formData.basicServices || [],
      additionalServices: formData.additionalServices || [],
      rates,
      media: {
        gallery: formData.photos || [],
        videos: formData.videos?.map(url => ({
          link: typeof url === 'string' ? url : '',
          preview: typeof url === 'string' ? url : ''
        })) || [],
        profilePicture: formData.photos?.[0] || '',
      },
      availability: formData.availability,
    };
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (validation.success) {
      setCurrentStep((prev) => Math.min(prev + 1, editSteps.length));
    } else {      // Validation errors
      toast.error('Por favor completa todos los campos requeridos');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const data = form.getValues();
    // Form data before submission

    setUploading(true);

    try {
      // Subir archivos multimedia solo si son nuevos (File objects)
      let photoUrls: string[] = [];
      let videoUrls: string[] = [];
      let audioUrls: string[] = [];

      // Separar archivos nuevos de URLs existentes
      const newPhotos = data.photos?.filter(photo => photo instanceof File) || [];
      const existingPhotoUrls = data.photos?.filter(photo => typeof photo === 'string') || [];

      const newVideos = data.videos?.filter(video => video instanceof File) || [];
      const existingVideoUrls = data.videos?.filter(video => typeof video === 'string') || [];

      const newAudios = data.audios?.filter(audio => audio instanceof File) || [];
      const existingAudioUrls = data.audios?.filter(audio => typeof audio === 'string') || [];

      if (newPhotos.length > 0) {
        toast.loading('Subiendo fotos nuevas...');
        const newPhotoUrls = await uploadMultipleImages(newPhotos);
        photoUrls = [...existingPhotoUrls, ...newPhotoUrls.filter((url): url is string => url !== null)];
        toast.dismiss();
        toast.success(`${newPhotoUrls.filter(url => url !== null).length} fotos nuevas subidas exitosamente`);
      } else {
        photoUrls = existingPhotoUrls;
      }

      if (newVideos.length > 0) {
        toast.loading('Subiendo videos nuevos...');
        const newVideoResults = await uploadMultipleVideos(newVideos);
        const newVideoUrls = newVideoResults.map(result => result.link);
        videoUrls = [...existingVideoUrls, ...newVideoUrls];
        toast.dismiss();
        toast.success(`${newVideoResults.length} videos nuevos subidos exitosamente`);
      } else {
        videoUrls = existingVideoUrls;
      }

      if (newAudios.length > 0) {
        toast.loading('Subiendo audios nuevos...');
        const newAudioUrls = await uploadMultipleAudios(newAudios);
        audioUrls = [...existingAudioUrls, ...newAudioUrls.filter((url): url is string => url !== null)];
        toast.dismiss();
        toast.success(`${newAudioUrls.filter(url => url !== null).length} audios nuevos subidos exitosamente`);
      } else {
        audioUrls = existingAudioUrls;
      }

      // Crear datos con URLs actualizadas
      const dataWithUrls = {
        ...data,
        photos: photoUrls,
        videos: videoUrls,
        audios: audioUrls,
      };

      const backendData = transformDataToBackendFormat(dataWithUrls);
      // Profile data ready for backend

      // Actualizar el perfil usando el servicio
      const loadingToast = toast.loading('Actualizando perfil...');
      try {
        await updateProfile(profileId, backendData);
        toast.dismiss(loadingToast);

        // Invalidar las queries para refrescar los datos
        if (session?.user?._id) {
          await queryClient.invalidateQueries({
            queryKey: ['userProfiles', session.user._id],
          });
          await queryClient.invalidateQueries({
            queryKey: ['profileDetails', profileId],
          });
        }

        toast.success('Perfil actualizado exitosamente');

        // Redirigir a la página de cuenta
        router.push('/cuenta');
      } catch (profileError) {
        toast.dismiss(loadingToast);
        // Error updating profile
        toast.error('Error al actualizar perfil. Contacta con servicio al cliente.');
      }
    } catch (error) {
      // Error uploading files
      toast.error('Error al subir archivos. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1EssentialInfo
            genderGroup={groupMap.gender}
            categoryGroup={groupMap.category}
          />
        );
      case 2:
        return <Step2Description serviceGroup={groupMap.services} />;
      case 3:
        return (
          <Step3Details
            skinGroup={groupMap.skin}
            eyeGroup={groupMap.eyes}
            hairGroup={groupMap.hair}
            bodyGroup={groupMap.body}
          />
        );
      case 4:
        return <Step5Multimedia />; // Multimedia ahora es paso 4

      default:
        return null;
    }
  };

  if (isLoadingAttributes || isLoadingProfile || !profileDetails || !attributeGroups) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (attributesError || profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del perfil.</p>
          <Link href="/cuenta">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a mis perfiles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FormProvider form={form} currentStep={currentStep}>
      <div className="min-h-screen mb-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Guidelines */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <SidebarContent currentStep={currentStep} />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-background rounded-xl shadow-sm border border-border p-8">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                  {currentStep === 1 ? (
                    <Link href="/cuenta">
                      <Button
                        variant="outline"
                        className="hover:bg-muted/50 transition-colors duration-200"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="hover:bg-muted/50 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Atrás
                    </Button>
                  )}

                  {currentStep === editSteps.length ? (
                    <Button
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                      disabled={uploading}
                      onClick={handleSubmit}
                    >
                      {uploading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando perfil...
                        </>
                      ) : (
                        'Actualizar perfil'
                      )}
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
      </div>

      {/* Progress Steps */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center space-x-4">
            {editSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-200 ${currentStep === step.id
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
    </FormProvider>
  );
}