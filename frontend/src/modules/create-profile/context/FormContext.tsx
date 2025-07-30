import { createContext, useContext, ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import type { FormData } from '../types';

interface FormContextType {
  form: UseFormReturn<FormData>;
  currentStep: number;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return {
    ...context.form,
    currentStep: context.currentStep
  };
}

interface FormProviderProps {
  children: ReactNode;
  form: UseFormReturn<FormData>;
  currentStep: number;
}

export function FormProvider({ children, form, currentStep }: FormProviderProps) {
  return (
    <FormContext.Provider value={{ form, currentStep }}>
      {children}
    </FormContext.Provider>
  );
}