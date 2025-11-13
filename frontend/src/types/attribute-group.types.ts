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
  variantValue: string;  // Cambiado de variantIndex a variantValue
  newValue?: string;
  newLabel?: string;
  active?: boolean;
}

export interface AddVariantInput {
  label: string;
  value: string;
}

export interface RemoveVariantInput {
  variantValue: string;  // Cambiado de variantIndex a variantValue
}

export interface UpdateGroupInput {
  name?: string;
  key?: string;
}

// Tipos específicos para los filtros
export interface FilterAttributeGroup {
  key: 'gender' | 'category'; // Removido 'sex'
  name: string;
  variants: Variant[];
}