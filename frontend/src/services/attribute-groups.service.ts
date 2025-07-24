interface AttributeVariant {
  value: string;
  active: boolean;
  _id: string;
}

export interface AttributeGroup {
  _id: string;
  name: string;
  key: string;
  variants: AttributeVariant[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export class AttributeGroupsService {
  private static readonly BASE_URL = 'http://localhost:4000/api';

  // Fallback data when API is not available
  private static readonly FALLBACK_DATA: AttributeGroup[] = [
    {
      "_id": "fallback-gender",
      "name": "Género",
      "key": "gender",
      "variants": [
        { "value": "Hombre", "active": true, "_id": "1" },
        { "value": "Mujer", "active": true, "_id": "2" },
        { "value": "Trans", "active": true, "_id": "3" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-category",
      "name": "Categoría",
      "key": "category",
      "variants": [
        { "value": "Escort", "active": true, "_id": "4" },
        { "value": "Escort Gay", "active": true, "_id": "5" },
        { "value": "Trans", "active": true, "_id": "6" },
        { "value": "Gigoló", "active": true, "_id": "7" },
        { "value": "Virtual", "active": true, "_id": "8" },
        { "value": "IA", "active": true, "_id": "9" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-services",
      "name": "Servicios",
      "key": "services",
      "variants": [
        { "value": "Atención Hombres", "active": true, "_id": "10" },
        { "value": "Atención Mujeres", "active": true, "_id": "11" },
        { "value": "Atención Parejas", "active": true, "_id": "12" },
        { "value": "Masajes", "active": true, "_id": "13" },
        { "value": "Videollamada erotica", "active": true, "_id": "14" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-skin",
      "name": "Color de piel",
      "key": "skin",
      "variants": [
        { "value": "Blanca", "active": true, "_id": "15" },
        { "value": "Trigueña", "active": true, "_id": "16" },
        { "value": "Morena", "active": true, "_id": "17" },
        { "value": "Negra", "active": true, "_id": "18" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-eyes",
      "name": "Color de ojos",
      "key": "eyes",
      "variants": [
        { "value": "Negros", "active": true, "_id": "19" },
        { "value": "Cafés", "active": true, "_id": "20" },
        { "value": "Verdes", "active": true, "_id": "21" },
        { "value": "Azules", "active": true, "_id": "22" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-hair",
      "name": "Color de cabello",
      "key": "hair",
      "variants": [
        { "value": "Negro", "active": true, "_id": "23" },
        { "value": "Castaño", "active": true, "_id": "24" },
        { "value": "Rubio", "active": true, "_id": "25" },
        { "value": "Pelirrojo", "active": true, "_id": "26" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    },
    {
      "_id": "fallback-sex",
      "name": "sexo",
      "key": "sex",
      "variants": [
        { "value": "straight", "active": true, "_id": "27" },
        { "value": "Gay", "active": true, "_id": "28" },
        { "value": "Lesbiana", "active": true, "_id": "29" },
        { "value": "Bisexual", "active": true, "_id": "30" }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "__v": 0
    }
  ];

  static async getAttributeGroups(): Promise<AttributeGroup[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/attribute-groups`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('API not available, using fallback data:', error);
      return this.FALLBACK_DATA;
    }
  }

  static getAttributeGroupByKey(attributeGroups: AttributeGroup[], key: string): AttributeGroup | null {
    return attributeGroups.find(group => group.key === key) || null;
  }

  static getActiveVariants(attributeGroup: AttributeGroup | null): string[] {
    if (!attributeGroup) return [];
    return attributeGroup.variants
      .filter(variant => variant.active)
      .map(variant => variant.value);
  }
}
