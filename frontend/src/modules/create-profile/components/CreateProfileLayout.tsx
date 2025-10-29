'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAttributeGroups } from '@/hooks/use-attribute-groups';
import { createProfile } from '@/services/user.service';
import {
  uploadMultipleAudios,
  uploadMultipleImages,
  uploadMultipleVideos,
  uploadProcessedImages,
  uploadMixedImages,
} from '@/utils/tools';
import { ProcessedImageResult } from '@/utils/imageProcessor';
import { FormProvider } from '../context/FormContext';
import { steps } from '../data';
import type { FormData } from '../schemas';
import type { AttributeGroup, Rate } from '../types';
import { normalizeSimpleText } from '@/utils/normalize-text';
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from '../schemas';

// Interfaces para manejo de errores de validación
interface ValidationError {
  path: string[];
  message: string;
}

interface ValidationResult {
  error?: {
    issues: ValidationError[];
  };
}

interface ApiError {
  response?: {
    status: number;
    data?: {
      message: string;
    };
  };
  message?: string;
}
import { SidebarContent } from './SidebarContent';
import { Step1EssentialInfo } from './Step1EssentialInfo';
import { Step2Description } from './Step2Description';
import { Step3Details } from './Step3Details';
import { Step4Plan } from './Step4Plan';
import { Step5Multimedia } from './Step5Multimedia';
import { ProfileVerificationPrompt } from './ProfileVerificationPrompt';


export function CreateProfileLayout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [createdProfileName, setCreatedProfileName] = useState<string>('');
  const [whatsAppData, setWhatsAppData] = useState<{ companyNumber: string; message: string } | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const form = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      // Step 1 - Lo esencial
      profileName: '',
      gender: '',
      // workType: '',
      category: '',
      location: {
        country: 'Colombia',
        department: 'Bogotá',
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
      socialMedia: {
        instagram: '',
        facebook: '',
        tiktok: '',
        twitter: '',
        onlyFans: '',
      },
      // bustSize: '',
      rates: [] as Rate[],
      availability: [],

      // Step 4 - Multimedia
      photos: [],
      videos: [],
      audios: [],
      processedImages: [],
      videoCoverImages: {},
      coverImageIndex: 0, // Primera imagen como preview por defecto

      // Step 5 - Finalizar
      selectedUpgrades: [],
      acceptTerms: false,

      // Step 5 - Selección de Plan (integrado en finalizar)
      selectedPlan: undefined,
      selectedVariant: undefined,
    },
  });

  const acceptTerms = form.watch('acceptTerms');

  const { data: attributeGroups, isLoading, error } = useAttributeGroups();

  // 1️⃣ Crea un map para lookup O(1)
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
          return step2Schema.safeParse(step2Data);
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
            eyeColor: form.getValues('eyeColor') || '',
            hairColor: form.getValues('hairColor') || '',
            bodyType: form.getValues('bodyType') || '',
            height: form.getValues('height') || '',
            // bustSize: form.getValues('bustSize') || '',
            rates: form.getValues('rates') || [],
            availability: form.getValues('availability') || [],
          };

          return step3Schema.safeParse(step3Data);
        }

        case 4: {
          // Validamos plan selection en paso 4
          const step4Data = {
            selectedUpgrades: form.getValues('selectedUpgrades') || [],
            selectedPlan: form.getValues('selectedPlan'),
            selectedVariant: form.getValues('selectedVariant'),
          };

          const result = step4Schema.safeParse(step4Data);

          if (!result.success) {
            console.error('❌ ERROR Step 4 - Validación fallida:', result.error.issues);
            result.error.issues.forEach((issue, index) => {
              console.error(`❌ ERROR ${index + 1}:`, {
                path: issue.path,
                message: issue.message,
                code: issue.code
              });
            });
          }

          return result;
        }

        case 5: {
          // Validamos multimedia en paso 5
          const step5Data = {
            photos: form.getValues('photos') || [],
            videos: form.getValues('videos') || [],
            audios: form.getValues('audios') || [],
            acceptTerms: form.getValues('acceptTerms') || false,
          };

          const result = step5Schema.safeParse(step5Data);

          return result;
        }



        default:
          return { success: true };
      }
    } catch (error) {
      // Error en validación
      return { success: false, error: { issues: [] } };
    }
  };

  const setValidationErrors = (result: ValidationResult) => {
    if (result.error && result.error.issues) {
      result.error.issues.forEach((error: ValidationError) => {
        const path = error.path;
        if (path.length === 1) {
          form.setError(path[0] as keyof FormData, {
            type: 'manual',
            message: error.message,
          });
        } else if (path.length === 2) {
          form.setError(`${path[0]}.${path[1]}` as keyof FormData, {
            type: 'manual',
            message: error.message,
          });
        }
      });
    }
  };

  const handleNext = async () => {
    try {
      const result = validateStep(currentStep);

      if (!result.success) {
        setValidationErrors(result);
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        // ✅ Scroll después de que React actualice el DOM
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    } catch (error) {
      toast.error('Error inesperado en la validación');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // ✅ Scroll después de que React actualice el DOM
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  // handleFormDataChange ya no es necesario con react-hook-form

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
    console.log('🖼️ === CONSTRUYENDO DATOS PARA BACKEND ===');
    console.log('coverImageIndex (debe ser 0):', formData.coverImageIndex);
    console.log('Primera foto (portada):', formData.photos?.[0]?.substring(0, 50) + '...');
    console.log('Total fotos:', formData.photos?.length || 0);

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
    };
  };

  const handleCreateProfileClick = () => {
    // ✅ VALIDAR PASO 5 ANTES DE PROCEDER
    const step5Result = validateStep(5);

    if (!step5Result.success) {
      setValidationErrors(step5Result);
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const formData = form.getValues();
    const hasPaidPlan = formData.selectedPlan &&
      formData.selectedPlan.code !== 'FREE' &&
      formData.selectedPlan.price > 0;

    if (hasPaidPlan) {
      setShowConfirmModal(true);
    } else {
      form.handleSubmit(handleFinalSave)();
    }
  };

  const handleFinalSave = async (data: FormData) => {
    try {
      setUploading(true);

      // ✅ VALIDACIÓN: Verificar que haya al menos 1 foto
      if (!data.photos || data.photos.length === 0) {
        toast.error('Debes subir al menos una foto para crear tu perfil');
        setUploading(false);
        return;
      }

      // ✅ VALIDACIONES CRÍTICAS PRE-SUBMIT
      const loadingValidation = toast.loading('Verificando límites de perfiles...');
      try {
        const { getUserProfiles } = await import('@/services/user.service');
        const userProfiles = await getUserProfiles(session?.user?._id || '');

        if (userProfiles.length >= 10) {
          toast.dismiss(loadingValidation);
          toast.error('Has alcanzado el límite máximo de perfiles permitidos.', { duration: 6000 });
          setUploading(false);
          return;
        }
        toast.dismiss(loadingValidation);
      } catch (validationError) {
        toast.dismiss(loadingValidation);
        console.error('Error verificando límites:', validationError);
        toast.error('Error al verificar límites. Contacta soporte.');
        setUploading(false);
        return;
      }

      console.log('🐛 DEBUG CRÍTICO:', {
        'data.processedImages existe': !!data.processedImages,
        'data.processedImages es array': Array.isArray(data.processedImages),
        'data.processedImages.length': data.processedImages?.length || 0,
        'data.processedImages contenido': data.processedImages,
        'data.photos.length': data.photos?.length || 0,
        'data.coverImageIndex': data.coverImageIndex
      });

      // 🎯 PASO CRÍTICO: REORDENAR IMÁGENES PROCESADAS SEGÚN coverImageIndex
      console.log('\n🔄 ===== REORDENANDO IMÁGENES PARA SUBIDA =====');
      console.log('coverImageIndex:', data.coverImageIndex);
      console.log('Total processedImages:', data.processedImages?.length || 0);
      console.log('Total photos:', data.photos?.length || 0);

      let orderedProcessedImages: ProcessedImageResult[] = [];
      const coverIndex = data.coverImageIndex ?? 0;

      if (data.processedImages && data.processedImages.length > 0) {
        // Convertir array a objeto indexado para fácil acceso
        const processedMap = new Map<number, ProcessedImageResult>();
        data.processedImages.forEach((img: ProcessedImageResult) => {
          if (img.originalIndex !== undefined) {
            processedMap.set(img.originalIndex, img);
          }
        });

        console.log('📦 Map de imágenes procesadas:', Array.from(processedMap.keys()));

        // Verificar que la imagen de portada exista y esté procesada
        const coverImage = processedMap.get(coverIndex);

        if (!coverImage) {
          console.error('❌ CRÍTICO: No se encontró imagen procesada para coverIndex', coverIndex);
          toast.error('Error: La imagen de portada no está procesada. Recorta la imagen de portada.');
          setUploading(false);
          return;
        }

        // 🎯 REORDENAR: La imagen de portada SIEMPRE va primero
        orderedProcessedImages.push(coverImage);
        console.log('✅ Imagen de portada agregada primero:', coverImage.originalFileName);

        // Agregar el resto de imágenes en orden, excluyendo la de portada
        data.photos.forEach((photo, idx) => {
          if (idx !== coverIndex) {
            const processedImg = processedMap.get(idx);
            if (processedImg) {
              orderedProcessedImages.push(processedImg);
              console.log(`  ✅ [${orderedProcessedImages.length - 1}] ${processedImg.originalFileName}`);
            } else {
              console.warn(`  ⚠️ No hay imagen procesada para índice ${idx}`);
            }
          }
        });

        console.log('📸 Orden final de subida:', orderedProcessedImages.map((img, i) =>
          `[${i}] ${img.originalFileName}`
        ));
      }

      /*  // Verificar que todas las imágenes tengan marca de agua
       const imagesWithoutWatermark = orderedProcessedImages.filter(img => {
         // Verificar si la URL del blob contiene indicios de procesamiento
         // (esto es aproximado, idealmente deberías tener un flag en ProcessedImageResult)
         return !img.url || img.compressionRatio === 0;
       });
 
       if (imagesWithoutWatermark.length > 0) {
         console.warn('⚠️ Imágenes sin marca de agua detectadas:', imagesWithoutWatermark.length);
         toast('Algunas imágenes pueden no tener marca de agua', { icon: '⚠️' });
       } */

      console.log('🔄 ===== FIN REORDENAMIENTO =====\n');

      // Subir archivos multimedia a Cloudinary
      let photoUrls: (string | null)[] = [];
      let videoUrls: (string | null)[] = [];
      let audioUrls: (string | null)[] = [];

      if (data.photos && data.photos.length > 0) {
        // ✅ USAR IMÁGENES REORDENADAS
        if (orderedProcessedImages.length > 0) {
          toast.loading('Subiendo fotos procesadas...', { id: 'upload-photos' });
          const processedUrls = await uploadProcessedImages(
            orderedProcessedImages,
            (current, total) => {
              toast.loading(`Subiendo foto procesada ${current}/${total}...`, { id: 'upload-photos' });
            }
          );
          photoUrls = [...photoUrls, ...processedUrls.filter(url => url !== null)];
          toast.dismiss('upload-photos');
          toast.success(`${processedUrls.filter(url => url !== null).length} fotos procesadas subidas exitosamente`);

          console.log('✅ URLs subidas:', photoUrls.map((url, i) => `[${i}] ${url?.substring(0, 50)}...`));
        } else {
          // Fallback: Si no hay imágenes procesadas, usar flujo original
          const photoFiles = data.photos.filter((photo): photo is File => photo instanceof File);

          if (photoFiles.length > 0) {
            toast.loading('Procesando y subiendo fotos...', { id: 'upload-photos' });

            // ⚠️ ADVERTENCIA: Este flujo no reordena según coverImageIndex
            console.warn('⚠️ Usando flujo original sin reordenamiento - considera procesar todas las imágenes');

            const originalUrls = await uploadMultipleImages(
              photoFiles,
              undefined,
              (current, total) => {
                toast.loading(`Procesando foto ${current}/${total}...`, { id: 'upload-photos' });
              }
            );
            photoUrls = [...photoUrls, ...originalUrls.filter(url => url !== null)];
            toast.dismiss('upload-photos');
            toast.success(`${originalUrls.filter(url => url !== null).length} fotos procesadas y subidas exitosamente`);
          }
        }

        // Mantener URLs existentes (strings)
        const existingPhotoUrls = data.photos.filter((photo): photo is string => typeof photo === 'string');
        photoUrls = [...photoUrls, ...existingPhotoUrls];
      }

      // [... resto del código de videos y audios sin cambios ...]

      if (data.videos && data.videos.length > 0) {
        const videoFiles = data.videos.filter((video): video is File => video instanceof File && video !== null);

        if (videoFiles.length > 0) {
          toast.loading('Subiendo videos...');
          const videoCoverImages = data.videoCoverImages || {};
          const uploadedVideos = await uploadMultipleVideos(videoFiles, videoCoverImages);
          toast.dismiss();
          toast.success(`${uploadedVideos.length} videos subidos exitosamente`);
          videoUrls = uploadedVideos as any;
        }

        const existingVideoUrls = data.videos.filter((video): video is string => typeof video === 'string' && video !== null);
        const existingVideoObjects = existingVideoUrls.map(url => ({
          link: url,
          preview: ''
        }));

        videoUrls = [...(videoUrls as any), ...existingVideoObjects];
      }

      if (data.audios && data.audios.length > 0) {
        const audioFiles = data.audios.filter((audio): audio is File => audio instanceof File);
        if (audioFiles.length > 0) {
          toast.loading('Subiendo audios...');
          const uploadedAudios = await uploadMultipleAudios(audioFiles);
          toast.dismiss();

          const successfulAudios = uploadedAudios.filter(url => url !== null);
          toast.success(`${successfulAudios.length} audios subidos exitosamente`);
          audioUrls = [...audioUrls, ...uploadedAudios];
        }

        const existingAudioUrls = data.audios.filter((audio): audio is string => typeof audio === 'string');
        audioUrls = [...audioUrls, ...existingAudioUrls];
      }

      // ✅ Crear datos con URLs reordenadas (la primera es la portada)
      const backendData = transformDataToBackendFormat({
        ...data,
        photos: photoUrls.filter(url => url !== null) as string[],
        videos: videoUrls as any,
        audios: audioUrls.filter(url => url !== null) as string[],
        // ✅ Ahora coverImageIndex siempre es 0 porque reordenamos
        coverImageIndex: 0,
        // ✅ Pasar imágenes reordenadas
        processedImages: orderedProcessedImages
      });

      // Preparar purchasedPlan si se seleccionó un plan de pago
      const purchasedPlan = data.selectedPlan && data.selectedVariant ? {
        planId: data.selectedPlan.id,
        planCode: data.selectedPlan.code,
        variantDays: data.selectedVariant.days,
        generateInvoice: data.generateInvoice || false,
        couponCode: data.couponCode || undefined
      } : null;

      // Crear el perfil usando el servicio
      const loadingToast = toast.loading('Creando perfil...');
      try {
        const response = await createProfile(backendData, purchasedPlan);

        toast.dismiss(loadingToast);

        // Invalidar la query de userProfiles para refrescar los datos
        if (session?.user?._id) {
          await queryClient.invalidateQueries({
            queryKey: ['userProfiles', session.user._id],
          });
        }

        toast.success('Perfil creado exitosamente');

        // Guardar información del perfil creado para el modal de verificación
        setCreatedProfileId(response.profile._id);
        setCreatedProfileName(response.profile.name || data.profileName);

        // Si hay mensaje de WhatsApp, guardarlo para usarlo después
        if (response.paymentRequired && response.whatsAppMessage) {
          const { companyNumber, message } = response.whatsAppMessage;
          setWhatsAppData({ companyNumber, message });
        }

        // Mostrar modal de verificación (el modal manejará WhatsApp si es necesario)
        setShowVerificationPrompt(true);
      } catch (profileError: unknown) {
        toast.dismiss(loadingToast);

        const error = profileError as ApiError;
        if (error?.response?.status === 409) {
          const errorMessage = error?.response?.data?.message || 'Límite de perfiles excedido';
          toast.error(errorMessage, { duration: 6000 });
        } else if (profileError?.response?.status === 400) {
          toast.error('Datos del perfil inválidos. Revisa la información ingresada.');
        } else if (profileError?.response?.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          router.push('/login');
        } else if (profileError?.response?.status >= 500) {
          toast.error('Error del servidor. Inténtalo más tarde.');
        } else {
          toast.error('Error al crear perfil. Contacta con servicio al cliente.');
        }
      }
    } catch (error) {
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
            /* formData={formData} */
            /* onChange={handleFormDataChange} */
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
        return <Step4Plan />; // Plan selection es paso 4
      case 5:
        return <Step5Multimedia />; // Multimedia es paso 5

      default:
        return null;
    }
  };

  if (isLoading) return <Loader />;

  if (error) return <p>Error al cargar atributos</p>;

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
                        onClick={handlePrevious}
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

                  {currentStep === 5 ? (
                    <Button
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                      disabled={!acceptTerms || uploading}
                      onClick={handleCreateProfileClick}
                    >
                      {uploading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo archivos...
                        </>
                      ) : (
                        'Crear perfil'
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

        {/* Progress Steps */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center space-x-4">
              {steps.map((step) => (
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

        {/* Modal de Confirmación */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>💎 Crear Perfil Premium</DialogTitle>
              <DialogDescription>
                Tienes 24 horas para completar el pago. Tu perfil estará visible si no superas el límite gratuito, de lo contrario permanecerá oculto hasta el pago.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false);
                  router.push('/cuenta');
                }}
                className="w-full sm:w-auto"
              >
                ⏰ Crear más tarde
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  form.handleSubmit(handleFinalSave)();
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                🚀 Crear y pagar ahora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Prompt de Verificación */}
        {createdProfileId && (
          <ProfileVerificationPrompt
            isOpen={showVerificationPrompt}
            onOpenChange={setShowVerificationPrompt}
            profileId={createdProfileId}
            profileName={createdProfileName}
            whatsAppData={whatsAppData}
          />
        )}
      </div>
    </FormProvider>
  );
}
