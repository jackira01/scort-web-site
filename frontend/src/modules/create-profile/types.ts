export interface Rate {
  id: string;
  time: string; // formato "30:00" para backend (horas:minutos)
  price: number;
}

export interface FormData {
  // Step 1 - Lo esencial
  profileName: string;
  gender: string;
  workType: string;
  category: string;
  location: {
    country: string;
    state: string;
    city: string;
  };

  // Step 2 - Descripción
  description: string;
  selectedServices: string[];

  // Step 3 - Detalles
  phoneNumber: string;
  age: string;
  skinColor: string;
  sexuality: string;
  eyeColor: string;
  hairColor: string;
  bodyType: string;
  height: string;
  bustSize: string;
  rates: Rate[];
  availability: Array<{
    dayOfWeek: string;
    slots: Array<{
      start: string;
      end: string;
      timezone: string;
    }>;
  }>;

  // Step 4 - Multimedia
  photos: File[];
  videos: File[];
  audios: File[];

  // Step 5 - Finalizar
  selectedUpgrades: string[];
  acceptTerms: boolean;
}

export interface Step {
  id: number;
  title: string;
  description: string;
}

export interface UpgradeOption {
  id: string;
  title: string;
  price: number;
  emoji: string;
  description: string;
}

export interface Variant {
  _id: string;
  value: string;
  active: boolean;
}

export interface AttributeGroup {
  _id: string;
  name: string;
  key: string;
  variants: Variant[];
}