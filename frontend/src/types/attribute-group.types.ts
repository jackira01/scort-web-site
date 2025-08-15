export interface Variant {
  label: string;  // Para mostrar al usuario
  value: string;  // Para lógica de negocio (normalizado, lowercase)
  active?: boolean;
  _id?: string;
}

export interface IAttributeGroup {
  _id: string;
  name: string;
  key: string;
  variants: Variant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttributeGroupInput {
  name: string;
  key: string;
  variants: { label: string; value: string }[];
}

export interface UpdateVariantInput {
  groupId: string;
  variantIndex: number;
  newValue?: string;
  active?: boolean;
}

// Tipos específicos para los filtros
export interface FilterAttributeGroup {
  key: 'gender' | 'category' | 'sex';
  name: string;
  variants: Variant[];
}