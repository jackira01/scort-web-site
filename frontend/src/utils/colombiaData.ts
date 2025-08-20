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
  // Ciudades principales como departamentos independientes
  "Bogotá": [
    "Usaquén",
    "Chapinero",
    "Santa Fe",
    "San Cristóbal",
    "Usme",
    "Tunjuelito",
    "Bosa",
    "Kennedy",
    "Fontibón",
    "Engativá",
    "Suba",
    "Barrios Unidos",
    "Teusaquillo",
    "Los Mártires",
    "Antonio Nariño",
    "Puente Aranda",
    "La Candelaria",
    "Rafael Uribe Uribe",
    "Ciudad Bolívar",
    "Sumapaz"
  ],
  /* "Medellín": [
    "Popular",
    "Santa Cruz",
    "Manrique",
    "Aranjuez",
    "Castilla",
    "Doce de Octubre",
    "Robledo",
    "Villa Hermosa",
    "Buenos Aires",
    "La Candelaria",
    "Laureles",
    "La América",
    "San Javier",
    "El Poblado",
    "Guayabal",
    "Belén",
    "San Sebastián de Palmitas",
    "San Cristóbal",
    "Altavista",
    "San Antonio",
    "Santa Helena"
  ],
  "Cali": [
    "Cali-Aguacatal",
    "Cauca Norte",
    "El Pondaje",
    "Cauca Sur",
    "Cañaveralejo",
    "Pance-Lili",
    "Zona Rural"
  ], */
  "Amazonas": [
    "Leticia",
    "Puerto Nariño"
  ],
  "Antioquia": [
    "Bello",
    "Itagüí",
    "Envigado",
    "Apartadó",
    "Turbo",
    "Rionegro",
    "Sabaneta",
    "La Estrella",
    "Copacabana"
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
    "Barranquilla",
    "Soledad",
    "Malambo",
    "Puerto Colombia",
    "Galapa",
    "Sabanagrande",
    "Baranoa",
    "Sabanalarga"
  ],
  "Bolívar": [
    "Cartagena",
    "Magangué",
    "Turbaco",
    "Arjona",
    "El Carmen de Bolívar",
    "Santa Rosa del Sur",
    "Mompox",
    "Santa Catalina"
  ],
  "Boyacá": [
    "Tunja",
    "Duitama",
    "Sogamoso",
    "Chiquinquirá",
    "Paipa",
    "Villa de Leyva",
    "Puerto Boyacá",
    "Monguí"
  ],
  "Caldas": [
    "Manizales",
    "Villamaría",
    "Chinchiná",
    "La Dorada",
    "Riosucio",
    "Anserma",
    "Palestina",
    "Supía"
  ],
  "Caquetá": [
    "Florencia",
    "San Vicente del Caguán",
    "Puerto Rico",
    "El Doncello",
    "La Montañita",
    "Belén de los Andaquíes",
    "Albania",
    "Curillo"
  ],
  "Casanare": [
    "Yopal",
    "Aguazul",
    "Villanueva",
    "Tauramena",
    "Monterrey",
    "Paz de Ariporo",
    "Hato Corozal",
    "Trinity"
  ],
  "Cauca": [
    "Popayán",
    "Santander de Quilichao",
    "Puerto Tejada",
    "Patía",
    "Corinto",
    "Guapi",
    "Timbío",
    "Piendamó"
  ],
  "Cesar": [
    "Valledupar",
    "Aguachica",
    "Bosconia",
    "Codazzi",
    "La Paz",
    "San Diego",
    "Curumaní",
    "El Paso"
  ],
  "Chocó": [
    "Quibdó",
    "Istmina",
    "Condoto",
    "Riosucio",
    "Acandí",
    "Capurganá",
    "Nuquí",
    "Bahía Solano"
  ],
  "Córdoba": [
    "Montería",
    "Lorica",
    "Cereté",
    "Sahagún",
    "Planeta Rica",
    "Montelíbano",
    "Ayapel",
    "Tierralta"
  ],
  "Cundinamarca": [
    "Soacha",
    "Girardot",
    "Zipaquirá",
    "Facatativá",
    "Chía",
    "Madrid",
    "Mosquera",
    "Funza",
    "Cajicá"
  ],
  "Guainía": [
    "Inírida",
    "Barranco Minas",
    "Mapiripana",
    "San Felipe",
    "Puerto Colombia",
    "La Guadalupe",
    "Cacahual",
    "Pana Pana"
  ],
  "Guaviare": [
    "San José del Guaviare",
    "Calamar",
    "El Retorno",
    "Miraflores"
  ],
  "Huila": [
    "Neiva",
    "Pitalito",
    "Garzón",
    "La Plata",
    "Campoalegre",
    "Timaná",
    "Gigante",
    "Aipe"
  ],
  "La Guajira": [
    "Riohacha",
    "Maicao",
    "Uribia",
    "Manaure",
    "San Juan del Cesar",
    "Villanueva",
    "El Molino",
    "Fonseca"
  ],
  "Magdalena": [
    "Santa Marta",
    "Ciénaga",
    "Fundación",
    "Aracataca",
    "El Banco",
    "Plato",
    "Zona Bananera",
    "Algarrobo"
  ],
  "Meta": [
    "Villavicencio",
    "Acacías",
    "Granada",
    "San Martín",
    "Puerto López",
    "Cumaral",
    "Restrepo",
    "El Dorado"
  ],
  "Nariño": [
    "Pasto",
    "Tumaco",
    "Ipiales",
    "Túquerres",
    "Samaniego",
    "La Unión",
    "Sandona",
    "Consacá"
  ],
  "Norte de Santander": [
    "Cúcuta",
    "Ocaña",
    "Pamplona",
    "Villa del Rosario",
    "Los Patios",
    "Tibú",
    "El Zulia",
    "San Cayetano"
  ],
  "Putumayo": [
    "Mocoa",
    "Puerto Asís",
    "Orito",
    "Valle del Guamuez",
    "Puerto Caicedo",
    "Villa Garzón",
    "Puerto Guzmán",
    "Leguízamo"
  ],
  "Quindío": [
    "Armenia",
    "Calarcá",
    "La Tebaida",
    "Montenegro",
    "Quimbaya",
    "Circasia",
    "Filandia",
    "Salento"
  ],
  "Risaralda": [
    "Pereira",
    "Dosquebradas",
    "Santa Rosa de Cabal",
    "La Virginia",
    "Marsella",
    "Belén de Umbría",
    "Apía",
    "Santuario"
  ],
  "San Andrés y Providencia": [
    "San Andrés",
    "Providencia",
    "Santa Catalina"
  ],
  "Santander": [
    "Bucaramanga",
    "Floridablanca",
    "Girón",
    "Piedecuesta",
    "Barrancabermeja",
    "San Gil",
    "Socorro",
    "Málaga"
  ],
  "Sucre": [
    "Sincelejo",
    "Corozal",
    "Sampués",
    "San Marcos",
    "Tolú",
    "Ovejas",
    "Morroa",
    "Los Palmitos"
  ],
  "Tolima": [
    "Ibagué",
    "Espinal",
    "Melgar",
    "Honda",
    "Líbano",
    "Chaparral",
    "Purificación",
    "Flandes"
  ],
  "Valle del Cauca": [
    "Palmira",
    "Buenaventura",
    "Tulúa",
    "Cartago",
    "Buga",
    "Jamundí",
    "Yumbo"
  ],
  "Vaupés": [
    "Mitú",
    "Carurú",
    "Pacoa",
    "Taraira",
    "Papunaua",
    "Yavaraté"
  ],
  "Vichada": [
    "Puerto Carreño",
    "La Primavera",
    "Santa Rosalía",
    "Cumaribo"
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
  return Object.values(colombiaLocations).map(dept => ({
    value: dept.normalized,
    label: dept.original
  }));
};

// Función para obtener todas las ciudades de un departamento en formato LocationValue
export const getCitiesByDepartment = (departmentNormalized: string): LocationValue[] => {
  const department = colombiaLocations[departmentNormalized];
  if (!department) return [];

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