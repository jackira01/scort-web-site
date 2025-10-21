// Función para normalizar texto (quitar tildes y caracteres especiales)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, ''); // Quitar otros caracteres especiales
};

// Estructura original para compatibilidad
export const colombiaDepartments = {
  "Bogotá": [
    "Antonio Nariño",
    "Barrios Unidos",
    "Bosa",
    "Chapinero",
    "Ciudad Bolívar",
    "Engativá",
    "Fontibón",
    "Kennedy",
    "La Candelaria",
    "Los Mártires",
    "Puente Aranda",
    "Rafael Uribe Uribe",
    "San Cristóbal",
    "Santa Fe",
    "Suba",
    "Sumapaz",
    "Teusaquillo",
    "Tunjuelito",
    "Usaquén",
    "Usme"
  ],
  "Amazonas": [
    "Leticia",
    "Puerto Nariño"
  ],
  "Antioquia": [
    "Apartadó",
    "Bello",
    "Copacabana",
    "Envigado",
    "Itagüí",
    "La Estrella",
    "Medellin",
    "Rionegro",
    "Sabaneta",
    "Turbo"
  ],
  "Arauca": [
    "Arauca",
    "Arauquita",
    "Cravo Norte",
    "Fortul",
    "Puerto Rondón",
    "Saravena",
    "Tame"
  ],
  "Atlántico": [
    "Baranoa",
    "Barranquilla",
    "Galapa",
    "Malambo",
    "Puerto Colombia",
    "Sabanagrande",
    "Sabanalarga",
    "Soledad"
  ],
  "Bolívar": [
    "Arjona",
    "Cartagena",
    "El Carmen de Bolívar",
    "Magangué",
    "Mompox",
    "Santa Catalina",
    "Santa Rosa del Sur",
    "Turbaco"
  ],
  "Boyacá": [
    "Chiquinquirá",
    "Duitama",
    "Monguí",
    "Paipa",
    "Puerto Boyacá",
    "Sogamoso",
    "Tunja",
    "Villa de Leyva"
  ],
  "Caldas": [
    "Anserma",
    "Chinchiná",
    "La Dorada",
    "Manizales",
    "Palestina",
    "Riosucio",
    "Supía",
    "Villamaría"
  ],
  "Caquetá": [
    "Albania",
    "Belén de los Andaquíes",
    "Curillo",
    "El Doncello",
    "Florencia",
    "La Montañita",
    "Puerto Rico",
    "San Vicente del Caguán"
  ],
  "Casanare": [
    "Aguazul",
    "Hato Corozal",
    "Monterrey",
    "Paz de Ariporo",
    "Tauramena",
    "Trinity",
    "Villanueva",
    "Yopal"
  ],
  "Cauca": [
    "Corinto",
    "Guapi",
    "Patía",
    "Piendamó",
    "Popayán",
    "Puerto Tejada",
    "Santander de Quilichao",
    "Timbío"
  ],
  "Cesar": [
    "Aguachica",
    "Bosconia",
    "Codazzi",
    "Curumaní",
    "El Paso",
    "La Paz",
    "San Diego",
    "Valledupar"
  ],
  "Chocó": [
    "Acandí",
    "Bahía Solano",
    "Capurganá",
    "Condoto",
    "Istmina",
    "Nuquí",
    "Quibdó",
    "Riosucio"
  ],
  "Córdoba": [
    "Ayapel",
    "Cereté",
    "Lorica",
    "Montelíbano",
    "Montería",
    "Planeta Rica",
    "Sahagún",
    "Tierralta"
  ],
  "Cundinamarca": [
    "Cajicá",
    "Chía",
    "Facatativá",
    "Funza",
    "Girardot",
    "Madrid",
    "Mosquera",
    "Soacha",
    "Zipaquirá"
  ],
  "Guainía": [
    "Barranco Minas",
    "Cacahual",
    "Inírida",
    "La Guadalupe",
    "Mapiripana",
    "Pana Pana",
    "Puerto Colombia",
    "San Felipe"
  ],
  "Guaviare": [
    "Calamar",
    "El Retorno",
    "Miraflores",
    "San José del Guaviare"
  ],
  "Huila": [
    "Aipe",
    "Campoalegre",
    "Garzón",
    "Gigante",
    "La Plata",
    "Neiva",
    "Pitalito",
    "Timaná"
  ],
  "La Guajira": [
    "El Molino",
    "Fonseca",
    "Maicao",
    "Manaure",
    "Riohacha",
    "San Juan del Cesar",
    "Uribia",
    "Villanueva"
  ],
  "Magdalena": [
    "Algarrobo",
    "Aracataca",
    "Ciénaga",
    "El Banco",
    "Fundación",
    "Plato",
    "Santa Marta",
    "Zona Bananera"
  ],
  "Meta": [
    "Acacías",
    "Cumaral",
    "El Dorado",
    "Granada",
    "Puerto López",
    "Restrepo",
    "San Martín",
    "Villavicencio"
  ],
  "Nariño": [
    "Consacá",
    "Ipiales",
    "La Unión",
    "Pasto",
    "Samaniego",
    "Sandona",
    "Tumaco",
    "Túquerres"
  ],
  "Norte de Santander": [
    "Cúcuta",
    "El Zulia",
    "Los Patios",
    "Ocaña",
    "Pamplona",
    "San Cayetano",
    "Tibú",
    "Villa del Rosario"
  ],
  "Putumayo": [
    "Mocoa",
    "Orito",
    "Puerto Asís",
    "Puerto Caicedo",
    "Puerto Guzmán",
    "Valle del Guamuez",
    "Villa Garzón",
    "Leguízamo"
  ],
  "Quindío": [
    "Armenia",
    "Calarcá",
    "Circasia",
    "Filandia",
    "La Tebaida",
    "Montenegro",
    "Quimbaya",
    "Salento"
  ],
  "Risaralda": [
    "Apía",
    "Belén de Umbría",
    "Dosquebradas",
    "La Virginia",
    "Marsella",
    "Pereira",
    "San Andrés",
    "Santa Rosa de Cabal"
  ],
  "San Andrés y Providencia": [
    "Providencia",
    "San Andrés",
    "Santa Catalina"
  ],
  "Santander": [
    "Barrancabermeja",
    "Bucaramanga",
    "Floridablanca",
    "Girón",
    "Málaga",
    "Piedecuesta",
    "San Gil",
    "Socorro"
  ],
  "Sucre": [
    "Corozal",
    "Los Palmitos",
    "Morroa",
    "Ovejas",
    "San Marcos",
    "Sampués",
    "Sincelejo",
    "Tolú"
  ],
  "Tolima": [
    "Chaparral",
    "Espinal",
    "Flandes",
    "Honda",
    "Ibagué",
    "Líbano",
    "Melgar",
    "Purificación"
  ],
  "Valle del Cauca": [
    "Buenaventura",
    "Buga",
    "Cali",
    "Cartago",
    "Jamundí",
    "Palmira",
    "Tulúa",
    "Yumbo"
  ],
  "Vaupés": [
    "Carurú",
    "Mitú",
    "Pacoa",
    "Papunaua",
    "Taraira",
    "Yavaraté"
  ],
  "Vichada": [
    "Cumaribo",
    "La Primavera",
    "Puerto Carreño",
    "Santa Rosalía"
  ]
} as const;

// Nueva estructura con nombres originales y normalizados
export const colombiaLocations = Object.entries(colombiaDepartments).reduce((acc, [department, cities]) => {
  const normalizedDepartment = normalizeText(department);
  acc[normalizedDepartment] = {
    original: department,
    normalized: normalizedDepartment,
    cities: cities.map(city => ({
      original: city,
      normalized: normalizeText(city)
    }))
  };
  return acc;
}, {} as Record<string, {
  original: string;
  normalized: string;
  cities: Array<{
    original: string;
    normalized: string;
  }>;
}>);

// Función helper para obtener departamento por nombre normalizado
export const getDepartmentByNormalized = (normalizedName: string) => {
  return colombiaLocations[normalizedName];
};

// Función helper para obtener ciudad por nombre normalizado dentro de un departamento
export const getCityByNormalized = (departmentNormalized: string, cityNormalized: string) => {
  const department = colombiaLocations[departmentNormalized];
  return department?.cities.find(city => city.normalized === cityNormalized);
};

// Función helper para validar si un departamento existe
export const isValidDepartment = (normalizedName: string): boolean => {
  return normalizedName in colombiaLocations;
};

// Función helper para validar si una ciudad existe en un departamento
export const isValidCity = (departmentNormalized: string, cityNormalized: string): boolean => {
  const department = colombiaLocations[departmentNormalized];
  return department?.cities.some(city => city.normalized === cityNormalized) || false;
};

// Tipos para el nuevo formato de ubicación
export interface LocationValue {
  value: string; // Valor normalizado (sin tildes, minúsculas)
  label: string; // Valor para mostrar (con tildes, formato original)
}

// Función para obtener todos los departamentos en formato LocationValue
export const getAllDepartments = (): LocationValue[] => {
  return Object.keys(colombiaDepartments).map((department) => ({
    value: normalizeText(department),
    label: department
  }));
};

// Función para obtener todas las ciudades de un departamento en formato LocationValue
export const getCitiesByDepartment = (departmentNormalized: string): LocationValue[] => {
  const department = colombiaLocations[departmentNormalized];
  if (!department || !department.cities) return [];

  return department.cities.map(city => ({
    value: city.normalized,
    label: city.original
  }));
};

// Función para obtener un departamento específico en formato LocationValue
export const getDepartmentLocationValue = (normalizedName: string): LocationValue | null => {
  const department = colombiaLocations[normalizedName];
  if (!department) return null;

  return {
    value: department.normalized,
    label: department.original
  };
};

// Función para obtener una ciudad específica en formato LocationValue
export const getCityLocationValue = (departmentNormalized: string, cityNormalized: string): LocationValue | null => {
  const city = getCityByNormalized(departmentNormalized, cityNormalized);
  if (!city) return null;

  return {
    value: city.normalized,
    label: city.original
  };
};

// Función para obtener el país Colombia en formato LocationValue
export const getCountryLocationValue = (): LocationValue => {
  return {
    value: 'colombia',
    label: 'Colombia'
  };
};

export type Department = keyof typeof colombiaDepartments;
export type City = typeof colombiaDepartments[Department][number];
export type NormalizedDepartment = keyof typeof colombiaLocations;
export type LocationData = typeof colombiaLocations[NormalizedDepartment];