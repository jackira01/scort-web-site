'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAttributeGroups } from '@/services/attribute-group.service';
import { FormProvider } from '../context/FormContext';
import { steps } from '../data';
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from '../schemas';
import type { AttributeGroup, Rate } from '../types';
import type { FormData } from '../schemas';
import { SidebarContent } from './SidebarContent';
import { Step1EssentialInfo } from './Step1EssentialInfo';
import { Step2Description } from './Step2Description';
import { Step3Details } from './Step3Details';
import { Step4Multimedia } from './Step4Multimedia';
import { Step5Finalize } from './Step5Finalize';

export function CreateProfileLayout() {
  const [currentStep, setCurrentStep] = useState(1);
  
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
        state: '',
        city: '',
      },

      // Step 2 - Descripción
      description: '',
      selectedServices: [],

      // Step 3 - Detalles
      phoneNumber: {
        phone: '',
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
      // bustSize: '',
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
  
  const acceptTerms = form.watch('acceptTerms');

  const { data: session } = useSession();

  const {
    data: attributeGroups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['attributeGroups'],
    queryFn: getAttributeGroups,
    staleTime: 1000 * 60 * 5, // 5 min
  });

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
              state: form.getValues('location.state') || '',
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
          const step3Data = {
            phoneNumber: {
              phone: form.getValues('phoneNumber.phone') || '',
              whatsapp: form.getValues('phoneNumber.whatsapp') || false,
              telegram: form.getValues('phoneNumber.telegram') || false,
            },
            age: form.getValues('age') || '',
            skinColor: form.getValues('skinColor') || '',
            sexuality: form.getValues('sexuality') || '',
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
          const step4Data = {
            photos: form.getValues('photos') || [],
            videos: form.getValues('videos') || [],
            audios: form.getValues('audios') || [],
          };
          return step4Schema.safeParse(step4Data);
        }
        
        case 5: {
          const step5Data = {
            acceptTerms: form.getValues('acceptTerms') || false,
            selectedUpgrades: form.getValues('selectedUpgrades') || [],
          };
          return step5Schema.safeParse(step5Data);
        }
        
        default:
          return { success: true };
      }
    } catch (error) {
      console.error('Error en validación:', error);
      return { success: false, error: { issues: [] } };
    }
  };
  
  const setValidationErrors = (result: any) => {
    if (result.error && result.error.issues) {
      result.error.issues.forEach((error: any) => {
        const path = error.path;
        if (path.length === 1) {
          form.setError(path[0] as any, {
            type: 'manual',
            message: error.message,
          });
        } else if (path.length === 2) {
          form.setError(`${path[0]}.${path[1]}` as any, {
            type: 'manual',
            message: error.message,
          });
        }
      });
    }
  };

  const handleNext = async () => {
    const result = validateStep(currentStep);

    console.log("result", result);
    
    if (!result.success) {
      setValidationErrors(result);
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // handleFormDataChange ya no es necesario con react-hook-form

  const transformDataToBackendFormat = (formData: FormData) => {
    const features = [];

    // Gender feature
    if (formData.gender && groupMap.gender?._id) {
      features.push({
        group: groupMap.gender._id,
        value: [formData.gender],
      });
    }

    // Hair color feature
    if (formData.hairColor && groupMap.hair?._id) {
      features.push({
        group: groupMap.hair._id,
        value: [formData.hairColor],
      });
    }

    // Eye color feature
    if (formData.eyeColor && groupMap.eyes?._id) {
      features.push({
        group: groupMap.eyes._id,
        value: [formData.eyeColor],
      });
    }

    // Skin color
    if (formData.skinColor && groupMap.skin?._id) {
      features.push({
        group: groupMap.skin._id,
        value: [formData.skinColor],
      });
    }

    // Sexuality
    if (formData.sexuality && groupMap.sex?._id) {
      features.push({
        group: groupMap.sex._id,
        value: [formData.sexuality],
      });
    }

    // Services → bodyType
    if (formData.selectedServices && groupMap.services?._id) {
      features.push({
        group: groupMap.services._id,
        value: formData.selectedServices,
      });
    }

    /* // WorkType → gender
    if (formData.workType && groupMap.gender?._id) {
      const workTypeMap: Record<string, string> = {
        'Yo mismo (independiente)': 'Escort',
        Agencia: 'Agencia',
      };
      features.push({
        group: groupMap.gender._id,
        value: [workTypeMap[formData.workType] || 'Escort'],
      });
    } */

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
        country: formData.location.country,
        state: formData.location.state,
        city: formData.location.city,
      },
      features,
      age: formData.age,
      phoneNumber: formData.phoneNumber,
      height: formData.height,
      media: {
        gallery: [], // Mock por ahora
        videos: [],
        stories: [],
      },
      verification: null,
      availability: formData.availability,
      rates,
    };
  };

  const handleFinalSave = (data: FormData) => {
    const backendData = transformDataToBackendFormat(data);
    console.log(
      'Profile data ready for backend:',
      JSON.stringify(backendData, null, 2),
    );
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
        return (
          <Step2Description
            serviceGroup={groupMap.services}
          />
        );
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

  if (isLoading) return <Loader />;

  if (error) return <p>Error al cargar atributos</p>;

  return (
    <FormProvider form={form} currentStep={currentStep}>
      <div className="min-h-screen mb-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
        {/* Header */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Guidelines */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <SidebarContent currentStep={currentStep} />

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3"
                  onClick={form.handleSubmit(handleFinalSave)}
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
                    disabled={!acceptTerms}
                    onClick={form.handleSubmit(handleFinalSave)}
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

        {/* Footer Badge */}
        <div className="fixed bottom-20 right-4 z-50">
          <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg">
            🟢 NICOLAS ALVAREZ
          </Badge>
        </div>
      </div>
    </FormProvider>
  );
}
