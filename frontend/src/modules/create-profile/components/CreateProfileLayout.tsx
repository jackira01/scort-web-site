'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Loader, User } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAttributeGroups } from '@/services/attribute-group.service';
import { steps } from '../data';
import type { AttributeGroup, FormData, Rate } from '../types';
import { SidebarContent } from './SidebarContent';
import { Step1EssentialInfo } from './Step1EssentialInfo';
import { Step2Description } from './Step2Description';
import { Step3Details } from './Step3Details';
import { Step4Multimedia } from './Step4Multimedia';
import { Step5Finalize } from './Step5Finalize';

export function CreateProfileLayout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Step 1 - Lo esencial
    profileName: '',
    gender: '',
    workType: '',
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
    phoneNumber: '',
    age: '',
    skinColor: '',
    sexuality: '',
    eyeColor: '',
    hairColor: '',
    bodyType: '',
    height: '',
    bustSize: '',
    rates: [] as Rate[],
    availability: [],

    // Step 4 - Multimedia
    photos: [],
    videos: [],
    audios: [],

    // Step 5 - Finalizar
    selectedUpgrades: [],
    acceptTerms: false,
  });

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
    return Object.fromEntries((attributeGroups as AttributeGroup[]).map((g: AttributeGroup) => [g.key, g]));
  }, [attributeGroups]);

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

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const transformDataToBackendFormat = () => {
    const features = [];

    // Gender feature
    if (formData.gender) {
      features.push({
        group: groupMap.gender,
        value: [formData.gender],
      });
    }

    // Hair color feature
    if (formData.hairColor) {
      features.push({
        group: groupMap.hairColor,
        value: [formData.hairColor],
      });
    }

    // Eye color feature
    if (formData.eyeColor) {
      features.push({
        group: groupMap.eyes,
        value: [formData.eyeColor],
      });
    }

    // Services as body type feature
    if (formData.selectedServices.length > 0) {
      features.push({
        group: groupMap.bodyType,
        value: formData.selectedServices,
      });
    }

    // Work type as gender feature
    if (formData.workType) {
      const workTypeMap: Record<string, string> = {
        'Yo mismo (independiente)': 'Escort',
        Agencia: 'Agencia',
      };
      features.push({
        group: groupMap.gender,
        value: [workTypeMap[formData.workType] || 'Escort'],
      });
    }

    // Transform rates to backend format
    const rates = formData.rates.map((rate) => ({
      hour: rate.time,
      price: rate.price,
    }));

    return {
      user: '687752518563ef690799a4ba', // Mock user ID
      name: formData.profileName,
      description: formData.description,
      location: {
        country: formData.location.country,
        state: formData.location.state,
        city: formData.location.city,
      },
      features,
      media: {
        gallery: [], // Mock empty arrays for now
        videos: [],
        stories: [],
      },
      verification: null,
      availability: formData.availability,
      rates,
    };
  };

  const handleFinalSave = () => {
    const backendData = transformDataToBackendFormat();
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
            formData={formData}
            onChange={handleFormDataChange}
            genderGroup={groupMap.gender}
            categoryGroup={groupMap.category}
          />
        );
      case 2:
        return (
          <Step2Description
            formData={formData}
            onChange={handleFormDataChange}
            serviceGroup={groupMap.services}
          />
        );
      case 3:
        return (
          <Step3Details formData={formData}
            onChange={handleFormDataChange}
            skinGroup={groupMap.skin}
            sexualityGroup={groupMap.sex}
            eyeGroup={groupMap.eyes}
            hairGroup={groupMap.hair}
            bodyGroup={groupMap.body} />
        );
      case 4:
        return (
          <Step4Multimedia
            formData={formData}
            onChange={handleFormDataChange}
          />
        );
      case 5:
        return (
          <Step5Finalize formData={formData} onChange={handleFormDataChange} />
        );
      default:
        return null;
    }
  };

  if (isLoading) return <Loader />;

  if (error) return <p>Error al cargar atributos</p>;

  return (
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
                onClick={handleFinalSave}
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
                    </Button></Link>
                )
                  : (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="hover:bg-muted/50 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Atrás
                    </Button>)
                }

                {currentStep === 5 ? (
                  <Button
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8"
                    disabled={!formData.acceptTerms}
                    onClick={handleFinalSave}
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
  );
}
