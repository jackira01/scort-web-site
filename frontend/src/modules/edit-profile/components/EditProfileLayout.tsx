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
import { steps } from '../../create-profile/data';
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
import { Step4Multimedia } from '../../create-profile/components/Step4Multimedia';
import { Step5Finalize } from '../../create-profile/components/Step5Finalize';

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
        state: '',
        city: '',
      },

      // Step 2 - Descripción
      description: '',
      selectedServices: [],

      // Step 3 - Detalles
      contact: {
        number: '',
        whatsapp: false,
        telegram: false,
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
        const feature = profileDetails.features?.find((f: any) => 
          f.group?.key === groupKey
        );
        const value = feature?.value?.[0] || '';
        // Feature procesado
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
        if (!profileDetails.rates || !Array.isArray(profileDetails.rates)) return [];
        return profileDetails.rates.map((rate: any, index: number) => ({
          id: rate.id || `rate-${index}`,
          time: rate.hour || rate.time || '',
          price: typeof rate.price === 'number' ? rate.price : parseFloat(rate.price) || 0,
          delivery: Boolean(rate.delivery),
        }));
      };

      // Actualizar valores del formulario usando setValue para mejor control
      const formData = {
        profileName: profileDetails.name || '',
        gender: getFeatureValue('gender'),
        category: profileDetails.category || '',
        location: {
          country: profileDetails.location?.country?.label || profileDetails.location?.country || 'Colombia',
          department: profileDetails.location?.department?.label || profileDetails.location?.department || '',
          city: profileDetails.location?.city?.label || profileDetails.location?.city || '',
        },
        description: profileDetails.description || '',
        selectedServices: getSelectedServices(),
        contact: {
          number: profileDetails.contact?.number || '',
          whatsapp: Boolean(profileDetails.contact?.whatsapp),
          telegram: Boolean(profileDetails.contact?.telegram),
        },
        age: profileDetails.age ? String(profileDetails.age) : '',
        skinColor: getFeatureValue('skin_color'),
        sexuality: getFeatureValue('sexuality'),
        eyeColor: getFeatureValue('eye_color'),
        hairColor: getFeatureValue('hair_color'),
        bodyType: getFeatureValue('body_type'),
        height: profileDetails.height ? String(profileDetails.height) : '',
        rates: convertRates(),
        availability: profileDetails.availability || [],
        photos: profileDetails.media?.gallery || [],
        videos: profileDetails.media?.videos || [],
        audios: profileDetails.media?.audios || [],
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
      form.setValue('selectedServices', formData.selectedServices);
      
      // Step 3 - Detalles y contacto
      form.setValue('contact.number', formData.contact.number);
      form.setValue('contact.whatsapp', formData.contact.whatsapp);
      form.setValue('contact.telegram', formData.contact.telegram);
      form.setValue('age', formData.age);
      form.setValue('skinColor', formData.skinColor);
      form.setValue('sexuality', formData.sexuality);
      form.setValue('eyeColor', formData.eyeColor);
      form.setValue('hairColor', formData.hairColor);
      form.setValue('bodyType', formData.bodyType);
      form.setValue('height', formData.height);
      form.setValue('rates', formData.rates);
      form.setValue('availability', formData.availability);
      
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
  }, [profileDetails, form, attributeGroups]);

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
          };
          return step2Schema.safeParse(step2Data);
        }

        case 3: {
          const contactData = form.getValues('contact') || {
            number: '',
            whatsapp: false,
            telegram: false,
          };
          const step3Data = {
            contact: {
              number: contactData.number || '',
              whatsapp: contactData.whatsapp || false,
              telegram: contactData.telegram || false,
            },
            age: form.getValues('age') || '',
            skinColor: form.getValues('skinColor') || '',
            sexuality: form.getValues('sexuality') || '',
            eyeColor: form.getValues('eyeColor') || '',
            hairColor: form.getValues('hairColor') || '',
            bodyType: form.getValues('bodyType') || '',
            height: form.getValues('height') || '',
            rates: form.getValues('rates') || [],
            availability: form.getValues('availability') || [],
          };
          return step3Schema.safeParse(step3Data);
        }

        case 4: {
          const step4Data = {
            photos: form.getValues('photos') || [],
            videos: form.getValues('videos') || [],
            audios: form.getValues('audios') || [],
          };
          return step4Schema.safeParse(step4Data);
        }

        case 5: {
          const step5Data = {
            selectedUpgrades: form.getValues('selectedUpgrades') || [],
            acceptTerms: form.getValues('acceptTerms') || false,
          };
          return step5Schema.safeParse(step5Data);
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

    // Sexuality
    if (formData.sexuality && groupMap.sex?._id) {
      features.push({
        group_id: groupMap.sex._id,
        value: [formData.sexuality],
      });
    }

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
      rates,
      media: {
        gallery: formData.photos || [],
        videos: formData.videos || [],
        audios: formData.audios || [],
        stories: [
          // Agregar fotos como stories de tipo 'image'
          ...(formData.photos || []).map((photoUrl) => ({
            link: photoUrl,
            type: 'image',
          })),
          // Agregar videos como stories de tipo 'video'
          ...(formData.videos || []).map((videoUrl) => ({
            link: videoUrl,
            type: 'video',
          })),
        ],
      },
      availability: formData.availability,
    };
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (validation.success) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } else {
      // Validation errors
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
        photoUrls = [...existingPhotoUrls, ...newPhotoUrls];
        toast.dismiss();
        toast.success(`${newPhotoUrls.length} fotos nuevas subidas exitosamente`);
      } else {
        photoUrls = existingPhotoUrls;
      }

      if (newVideos.length > 0) {
        toast.loading('Subiendo videos nuevos...');
        const newVideoUrls = await uploadMultipleVideos(newVideos);
        videoUrls = [...existingVideoUrls, ...newVideoUrls];
        toast.dismiss();
        toast.success(`${newVideoUrls.length} videos nuevos subidos exitosamente`);
      } else {
        videoUrls = existingVideoUrls;
      }

      if (newAudios.length > 0) {
        toast.loading('Subiendo audios nuevos...');
        const newAudioUrls = await uploadMultipleAudios(newAudios);
        audioUrls = [...existingAudioUrls, ...newAudioUrls];
        toast.dismiss();
        toast.success(`${newAudioUrls.length} audios nuevos subidos exitosamente`);
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
            sexualityGroup={groupMap.sex}
            eyeGroup={groupMap.eyes}
            hairGroup={groupMap.hair}
            bodyGroup={groupMap.body}
          />
        );
      case 4:
        return <Step4Multimedia />;
      case 5:
        return <Step5Finalize />;
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/cuenta">
              <Button
                variant="ghost"
                className="mb-4 hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a mis perfiles
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Editar Perfil
              </h1>
              <p className="text-muted-foreground">
                Actualiza la información de tu perfil
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <SidebarContent
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Step Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-white/20 text-white">
                          Paso {currentStep} de {steps.length}
                        </Badge>
                        {currentStep === steps.length && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Listo para actualizar
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold">
                        {steps[currentStep - 1]?.title}
                      </h2>
                      <p className="text-white/80">
                        {steps[currentStep - 1]?.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-6">{renderStepContent()}</div>

                {/* Navigation */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>

                    {currentStep < steps.length ? (
                      <Button
                        onClick={handleNext}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={!acceptTerms || uploading}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Actualizar Perfil
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}