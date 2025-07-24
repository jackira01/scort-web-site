// Test the profile data transformation
const mockFormData = {
  profileName: "Test Profile",
  gender: "Mujer",
  workType: "Yo mismo (independiente)",
  hairColor: "Rubio",
  eyeColor: "Verdes",
  selectedServices: ["Atención Hombres", "Atención Mujeres"],
  description: "Test description",
  location: {
    country: "Colombia",
    state: "Antioquia", 
    city: "Medellín"
  },
  rates: [
    { time: "01:00", price: 100000 },
    { time: "02:00", price: 180000 }
  ],
  availability: [
    {
      dayOfWeek: "lunes",
      slots: [
        {
          start: "09:00",
          end: "17:00",
          timezone: "America/Bogota"
        }
      ]
    }
  ]
};

const ATTRIBUTE_GROUPS = {
  sex: "688072a73979c0ae141519e1",
  hairColor: "688072a73979c0ae141519ec", 
  eyes: "688072a73979c0ae141519e5",
  bodyType: "688072a73979c0ae141519f3",
  gender: "688072a73979c0ae14151a15"
};

const transformDataToBackendFormat = (formData) => {
  const features = [];

  // Gender feature
  if (formData.gender) {
    features.push({
      group: ATTRIBUTE_GROUPS.sex,
      value: [formData.gender]
    });
  }

  // Hair color feature
  if (formData.hairColor) {
    features.push({
      group: ATTRIBUTE_GROUPS.hairColor,
      value: [formData.hairColor]
    });
  }

  // Eye color feature  
  if (formData.eyeColor) {
    features.push({
      group: ATTRIBUTE_GROUPS.eyes,
      value: [formData.eyeColor]
    });
  }

  // Services as body type feature
  if (formData.selectedServices && formData.selectedServices.length > 0) {
    features.push({
      group: ATTRIBUTE_GROUPS.bodyType,
      value: formData.selectedServices
    });
  }

  // Work type as gender feature
  if (formData.workType) {
    const workTypeMap = {
      "Yo mismo (independiente)": "Escort",
      "Agencia": "Agencia"
    };
    features.push({
      group: ATTRIBUTE_GROUPS.gender,
      value: [workTypeMap[formData.workType] || "Escort"]
    });
  }

  // Transform rates to backend format
  const rates = formData.rates ? formData.rates.map(rate => ({
    hour: rate.time,
    price: rate.price
  })) : [];

  return {
    user: "687752518563ef690799a4ba", // Mock user ID
    name: formData.profileName,
    description: formData.description,
    location: {
      country: formData.location.country,
      state: formData.location.state,
      city: formData.location.city
    },
    features,
    media: {
      gallery: [], // Mock empty arrays for now
      videos: [],
      stories: []
    },
    verification: null,
    availability: formData.availability || [],
    rates
  };
};

const result = transformDataToBackendFormat(mockFormData);
console.log('Transformed data:', JSON.stringify(result, null, 2));
