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

  static async getAttributeGroups(): Promise<AttributeGroup[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/attribute-groups`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching attribute groups:', error);
      return [];
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
