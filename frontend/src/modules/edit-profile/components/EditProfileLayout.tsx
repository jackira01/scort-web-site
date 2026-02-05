'use client';

import { Button } from '@/components/ui/button';
import { useAttributeGroups } from '@/hooks/use-attribute-groups';
import { useProfile } from '@/hooks/use-profile';
import { usePlans } from '@/hooks/usePlans';
import { updateProfile } from '@/services/user.service';
import { normalizeSimpleText } from '@/utils/normalize-text';
import {
  uploadMultipleAudios,
  uploadMultipleImages,
  uploadMultipleVideos,
} from '@/utils/tools';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { SidebarContent } from '../../create-profile/components/SidebarContent';
import { Step1EssentialInfo } from '../../create-profile/components/Step1EssentialInfo';
import { Step2Description } from '../../create-profile/components/Step2Description';
import { Step3Details } from '../../create-profile/components/Step3Details';
import { Step5Multimedia } from '../../create-profile/components/Step5Multimedia';
import { FormProvider } from '../../create-profile/context/FormContext';
import type { FormData } from '../../create-profile/schemas';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from '../../create-profile/schemas';
import type { AttributeGroup, Rate } from '../../create-profile/types';
import { editSteps } from '../data';

interface EditProfileLayoutProps {
  profileId: string;
}

export function EditProfileLayout({ profileId }: EditProfileLayoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Obtener datos del perfil existente
  const { data: profileDetails, isLoading: isLoadingProfile, error: profileError } = useProfile(profileId);
  const { data: attributeGroups, isLoading: isLoadingAttributes, error: attributesError } = useAttributeGroups();


  // 🎯 Obtener planes disponibles para buscar el plan asignado
  const { data: plansResponse } = usePlans({
    limit: 50,
    page: 1,
    isActive: true
  });

  // Memorizar planes y buscar el plan asignado al perfil
  const assignedPlan = useMemo(() => {
    if (!profileDetails?.planAssignment || !plansResponse?.plans) {
      return null;
    }

    const { planId, planCode } = profileDetails.planAssignment;

    // Buscar por planId (preferido)
    if (planId) {
      const plan = plansResponse.plans.find(p => p._id === planId);
      if (plan) {
        return plan;
      }
    }

    // Fallback: buscar por planCode
    if (planCode) {
      const plan = plansResponse.plans.find(p => p.code === planCode);
      if (plan) {
        return plan;
      }
    }

    console.warn('⚠️ No se encontró el plan asignado:', { planId, planCode });
    return null;
  }, [profileDetails?.planAssignment, plansResponse?.plans]);

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
      basicServices: [],
      additionalServices: [],

      // Step 3 - Detalles
      contact: {
        number: '',
        whatsapp: '',
        telegram: '',
      },
      age: '',
      skinColor: '',
      eyeColor: '',
      hairColor: '',
      bodyType: '',
      height: '',
      rates: [] as Rate[],
      availability: [],
      socialMedia: {
        instagram: '',
        facebook: '',
        tiktok: '',
        twitter: '',
        onlyFans: '',
      },

      // Step 4 - Multimedia
      photos: [],
      videos: [],
      audios: [],
      videoCoverImages: {}, // ✅ AGREGADO
      coverImageIndex: 0, // ✅ AGREGADO
      processedImages: [], // ✅ AGREGADO

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

        const rawValue = feature?.value?.[0] || '';

        // Si el valor es un objeto {key, label}, extraer el key
        const value = typeof rawValue === 'object' && rawValue !== null && 'key' in rawValue
          ? rawValue.key
          : rawValue;

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
        const rawValue = genderFeature?.value?.[0] || '';

        // Si el valor es un objeto {key, label}, extraer el key
        const value = typeof rawValue === 'object' && rawValue !== null && 'key' in rawValue
          ? rawValue.key
          : rawValue;

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
        const rawValue = categoryFeature?.value?.[0] || categoryFeature?.groupName || profileDetails.category || '';

        // Si el valor es un objeto {key, label}, extraer el key
        const value = typeof rawValue === 'object' && rawValue !== null && 'key' in rawValue
          ? rawValue.key
          : rawValue;

        return value;
      };

      // Obtener servicios seleccionados - extraer keys si son objetos
      const getSelectedServices = () => {
        const servicesFeature = profileDetails.features?.find((f: any) =>
          f.group?.key === 'services'
        );
        const services = servicesFeature?.value || [];

        // Mapear servicios extrayendo el key si son objetos
        return services.map((service: any) => {
          if (typeof service === 'object' && service !== null && 'key' in service) {
            return service.key;
          }
          return service;
        });
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
          departmentValue: profileDetails.location?.department?.value || '', // Agregar value para el Select
          city: profileDetails.location?.city?.label || profileDetails.location?.city || '',
          cityValue: profileDetails.location?.city?.value || '', // Agregar value para el Select
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
        deposito: profileDetails.deposito ?? false,
      };

      // Establecer cada valor individualmente para asegurar que los campos controlados se actualicen
      // Step 1 - Campos esenciales
      form.setValue('profileName', formData.profileName);
      form.setValue('gender', formData.gender);
      form.setValue('category', formData.category);
      form.setValue('location.country', formData.location.country);
      form.setValue('location.department', formData.location.department);
      form.setValue('location.departmentValue', formData.location.departmentValue);
      form.setValue('location.city', formData.location.city);
      form.setValue('location.cityValue', formData.location.cityValue);

      // Step 2 - Descripción y servicios
      form.setValue('description', formData.description);

      // Helper para extraer keys de servicios (si son objetos)
      const extractServiceKeys = (services: any[]) => {
        return services.map((service: any) => {
          if (typeof service === 'object' && service !== null && 'key' in service) {
            return service.key;
          }
          return service;
        });
      };

      // Calcular selectedServices como la unión de basicServices y additionalServices
      const basicServicesKeys = extractServiceKeys(profileDetails.basicServices || []);
      const additionalServicesKeys = extractServiceKeys(profileDetails.additionalServices || []);
      const allServices = [
        ...basicServicesKeys,
        ...additionalServicesKeys
      ];
      const uniqueServices = [...new Set(allServices)]; // Eliminar duplicados

      form.setValue('selectedServices', uniqueServices);
      form.setValue('basicServices', basicServicesKeys);
      form.setValue('additionalServices', additionalServicesKeys);

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

      // ✅ AGREGAR: Inicializar multimedia extras
      form.setValue('videoCoverImages', {});
      form.setValue('coverImageIndex', 0); // Primera foto por defecto
      form.setValue('processedImages', []); // Se llenará cuando procesen nuevas imágenes

      // 🎯 NUEVO: Pasar el plan asignado al formulario para que Step5Multimedia use los límites correctos
      if (assignedPlan) {
        form.setValue('selectedPlan', assignedPlan as any);
      } else {
        console.warn('⚠️ No hay plan asignado, Step5Multimedia usará límites por defecto');
      }

      // Step 5 - Finalizar
      form.setValue('selectedUpgrades', formData.selectedUpgrades);
      form.setValue('acceptTerms', formData.acceptTerms);
      form.setValue('deposito', formData.deposito);

      // Forzar re-render de los campos controlados
      form.trigger();
    }
  }, [profileDetails, attributeGroups, assignedPlan]);

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

  // Helper para convertir un key de variante a objeto {key, label}
  const getVariantObject = (groupKey: string, valueKey: string) => {
    const group = groupMap[groupKey];
    if (!group || !group.variants) return valueKey; // Fallback a string por retrocompatibilidad

    const variant = group.variants.find((v: any) => v.value === valueKey);
    if (variant) {
      return { key: variant.value, label: variant.label };
    }
    return valueKey; // Fallback si no se encuentra
  };

  // Helper para convertir un array de keys a array de objetos {key, label}
  const getVariantObjects = (groupKey: string, valueKeys: string[]) => {
    return valueKeys.map(key => getVariantObject(groupKey, key));
  };

  const transformDataToBackendFormat = (
    formData: FormData & {
      photos?: string[];
      videos?: (string | { link: string; preview: string })[];
      audios?: string[];
    },
  ) => {
    const features = [];

    // Gender feature
    if (formData.gender && groupMap.gender?._id) {
      features.push({
        group_id: groupMap.gender._id,
        value: [getVariantObject('gender', formData.gender)],
      });
    }

    // Hair color feature
    if (formData.hairColor && groupMap.hair?._id) {
      features.push({
        group_id: groupMap.hair._id,
        value: [getVariantObject('hair', formData.hairColor)],
      });
    }

    // Eye color feature
    if (formData.eyeColor && groupMap.eyes?._id) {
      features.push({
        group_id: groupMap.eyes._id,
        value: [getVariantObject('eyes', formData.eyeColor)],
      });
    }

    // Skin color
    if (formData.skinColor && groupMap.skin?._id) {
      features.push({
        group_id: groupMap.skin._id,
        value: [getVariantObject('skin', formData.skinColor)],
      });
    }

    // Body type feature
    if (formData.bodyType && groupMap.body?._id) {
      features.push({
        group_id: groupMap.body._id,
        value: [getVariantObject('body', formData.bodyType)],
      });
    }

    // Category feature
    if (formData.category && groupMap.category?._id) {
      features.push({
        group_id: groupMap.category._id,
        value: [getVariantObject('category', formData.category)],
      });
    }

    // Services
    if (formData.selectedServices && groupMap.services?._id) {
      features.push({
        group_id: groupMap.services._id,
        value: getVariantObjects('services', formData.selectedServices),
      });
    }

    const rates = formData.rates?.map((rate) => ({
      hour: rate.time,
      price: rate.price,
      delivery: rate.delivery,
    }));

    // ✅ SIMPLIFICADO: Ya reordenamos en handleFinalSave, así que la primera foto ES la portada

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
      socialMedia: formData.socialMedia,
      basicServices: formData.basicServices ? getVariantObjects('services', formData.basicServices) : [],
      additionalServices: formData.additionalServices ? getVariantObjects('services', formData.additionalServices) : [],
      media: {
        gallery: formData.photos || [],
        videos: (formData.videos || [])
          .filter((video): video is string | { link: string; preview: string } => video !== null)
          .map(video => {
            if (typeof video === 'string') {
              return { link: video, preview: '' };
            } else {
              return { link: video.link, preview: video.preview };
            }
          }),
        audios: formData.audios || [],
        stories: [],
        // ✅ SIMPLIFICADO: La primera foto del array ES la portada (ya reordenada)
        profilePicture: formData.photos?.[0] || '',
      },
      verification: null,
      availability: formData.availability,
      rates,
      deposito: formData.deposito,
    };
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (validation.success) {
      setCurrentStep((prev) => Math.min(prev + 1, editSteps.length));
      // ✅ Scroll después de que React actualice el DOM
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {      // Validation errors
      toast.error('Por favor completa todos los campos requeridos');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    // ✅ Scroll después de que React actualice el DOM
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSubmit = async () => {
    const data = form.getValues();


    setUploading(true);

    try {
      // 🎯 PASO CRÍTICO: REORDENAR IMÁGENES SEGÚN coverImageIndex (igual que en creación)

      let orderedProcessedImages: any[] = [];
      const coverIndex = data.coverImageIndex ?? 0;

      // Separar archivos nuevos (File) de URLs existentes (string)
      const newPhotos = data.photos?.filter(photo => photo instanceof File) || [];
      const existingPhotoUrls = data.photos?.filter(photo => typeof photo === 'string') || [];


      // 🎯 REORDENAR URLs EXISTENTES según coverImageIndex
      let reorderedExistingUrls = existingPhotoUrls;
      if (existingPhotoUrls.length > 0 && coverIndex > 0 && coverIndex < existingPhotoUrls.length) {

        // Poner la URL de portada primero
        const coverUrl = existingPhotoUrls[coverIndex];
        reorderedExistingUrls = [
          coverUrl,
          ...existingPhotoUrls.filter((_, idx) => idx !== coverIndex)
        ];

        reorderedExistingUrls.forEach((url, idx) => {
        });
      } else if (coverIndex === 0) {
      }

      // Solo reordenar si hay imágenes nuevas procesadas
      if (data.processedImages && data.processedImages.length > 0) {
        const processedMap = new Map<number, any>();
        data.processedImages.forEach((img: any) => {
          if (img.originalIndex !== undefined) {
            processedMap.set(img.originalIndex, img);
          }
        });


        const coverImage = processedMap.get(coverIndex);

        if (coverImage) {
          // 🎯 REORDENAR: La imagen de portada va primero
          orderedProcessedImages.push(coverImage);

          // Agregar el resto excluyendo la de portada
          data.photos.forEach((photo: any, idx: number) => {
            if (idx !== coverIndex && photo instanceof File) {
              const processedImg = processedMap.get(idx);
              if (processedImg) {
                orderedProcessedImages.push(processedImg);
              }
            }
          });
        }
      }

      // Subir archivos multimedia
      let photoUrls: string[] = [];
      let videoUrls: any[] = [];
      let audioUrls: string[] = [];

      // ✅ FOTOS: Usar imágenes reordenadas si existen
      if (newPhotos.length > 0) {
        if (orderedProcessedImages.length > 0) {
          // Subir imágenes procesadas reordenadas
          toast.loading('Subiendo fotos procesadas...', { id: 'upload-photos' });
          const { uploadProcessedImages } = await import('@/utils/tools');
          const processedUrls = await uploadProcessedImages(
            orderedProcessedImages,
            (current, total) => {
              toast.loading(`Subiendo foto procesada ${current}/${total}...`, { id: 'upload-photos' });
            }
          );
          photoUrls = [...processedUrls.filter((url): url is string => url !== null), ...reorderedExistingUrls];
          toast.dismiss('upload-photos');
          toast.success(`${processedUrls.filter(url => url !== null).length} fotos procesadas subidas`);
        } else {
          // Procesar y subir sin reordenamiento
          toast.loading('Procesando y subiendo fotos...', { id: 'upload-photos' });
          console.warn('⚠️ No hay imágenes procesadas - procesando ahora');
          const newPhotoUrls = await uploadMultipleImages(
            newPhotos,
            undefined,
            (current, total) => {
              toast.loading(`Procesando foto ${current}/${total}...`, { id: 'upload-photos' });
            }
          );
          photoUrls = [...newPhotoUrls.filter((url): url is string => url !== null), ...reorderedExistingUrls];
          toast.dismiss('upload-photos');
          toast.success(`${newPhotoUrls.filter(url => url !== null).length} fotos subidas`);
        }
      } else {
        // 🎯 CASO CRÍTICO: Solo URLs existentes, usar las reordenadas
        photoUrls = reorderedExistingUrls;
      }

      // ✅ VIDEOS: Manejar correctamente objetos y archivos
      const newVideos = data.videos?.filter(video => video instanceof File) || [];
      const existingVideos = data.videos?.filter(video =>
        typeof video === 'object' && video !== null && 'link' in video
      ) || [];
      const existingVideoStrings = data.videos?.filter(video => typeof video === 'string') || [];

      if (newVideos.length > 0) {
        toast.loading('Subiendo videos nuevos...');
        const videoCoverImages = data.videoCoverImages || {};
        const newVideoResults = await uploadMultipleVideos(newVideos, videoCoverImages);

        videoUrls = [
          ...newVideoResults,  // Videos nuevos primero
          ...existingVideos,
          ...existingVideoStrings.map(url => ({ link: url, preview: '' }))
        ];

        toast.dismiss();
        toast.success(`${newVideoResults.length} videos subidos`);
      } else {
        videoUrls = [
          ...existingVideos,
          ...existingVideoStrings.map(url => ({ link: url, preview: '' }))
        ];
      }

      // ✅ AUDIOS
      const newAudios = data.audios?.filter(audio => audio instanceof File) || [];
      const existingAudioUrls = data.audios?.filter(audio => typeof audio === 'string') || [];

      if (newAudios.length > 0) {
        toast.loading('Subiendo audios nuevos...');
        const newAudioUrls = await uploadMultipleAudios(newAudios);
        audioUrls = [...newAudioUrls.filter((url): url is string => url !== null), ...existingAudioUrls];
        toast.dismiss();
        toast.success(`${newAudioUrls.filter(url => url !== null).length} audios subidos`);
      } else {
        audioUrls = existingAudioUrls;
      }

      // Crear datos con URLs actualizadas
      const dataWithUrls = {
        ...data,
        photos: photoUrls,
        videos: videoUrls,
        audios: audioUrls,
        // ✅ Ahora coverImageIndex siempre es 0 porque reordenamos
        coverImageIndex: 0,
        processedImages: orderedProcessedImages
      };

      const backendData = transformDataToBackendFormat(dataWithUrls);

      // Actualizar el perfil
      const loadingToast = toast.loading('Actualizando perfil...');
      try {
        await updateProfile(profileId, backendData);
        toast.dismiss(loadingToast);

        // Invalidar queries
        if (session?.user?._id) {
          await queryClient.invalidateQueries({
            queryKey: ['userProfiles', session.user._id],
          });
          await queryClient.invalidateQueries({
            queryKey: ['profileDetails', profileId],
          });
        }

        toast.success('Perfil actualizado exitosamente');
        router.push(returnUrl || '/cuenta');
      } catch (profileError) {
        toast.dismiss(loadingToast);
        toast.error('Error al actualizar perfil. Contacta con servicio al cliente.');
      }
    } catch (error) {
      console.error('❌ Error al subir archivos:', error);
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
            isEditing={true}
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
          <Link href={returnUrl || "/cuenta"}>
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
                <SidebarContent currentStep={currentStep} isEditMode={true} />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-background rounded-xl shadow-sm border border-border p-8">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                  {currentStep === 1 ? (
                    <Link href={returnUrl || "/cuenta"}>
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