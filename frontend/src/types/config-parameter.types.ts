// Tipos base para parámetros de configuración
export type ConfigParameterType = 
    | 'location' 
    | 'text' 
    | 'membership' 
    | 'number' 
    | 'boolean' 
    | 'array' 
    | 'object' 
    | 'json';

export interface UIConfig {
    component?: string;
    editable?: boolean;
    hierarchical?: boolean;
    translatable?: boolean;
    rich_text?: boolean;
    price_editable?: boolean;
    feature_management?: boolean;
    custom_props?: Record<string, any>;
}

export interface ConfigMetadata {
    description?: string;
    validation?: Record<string, any>;
    ui_config?: UIConfig;
    cache_ttl?: number; // TTL en segundos
    requires_restart?: boolean;
    environment?: 'development' | 'production' | 'all';
}

export interface ConfigParameter {
    _id: string;
    key: string;
    name: string;
    type: ConfigParameterType;
    category: string;
    value: any;
    metadata?: ConfigMetadata;
    isActive: boolean;
    version: number;
    lastModified: string; // ISO date string
    modifiedBy: {
        _id: string;
        name: string;
        email: string;
    };
    tags?: string[];
    dependencies?: string[];
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    hasHistory?: boolean;
}

// Input types para crear y actualizar
export interface CreateConfigParameterInput {
    key: string;
    name: string;
    type: ConfigParameterType;
    category: string;
    value: any;
    metadata?: ConfigMetadata;
    tags?: string[];
    dependencies?: string[];
}

export interface UpdateConfigParameterInput {
    name?: string;
    value?: any;
    metadata?: ConfigMetadata;
    isActive?: boolean;
    tags?: string[];
    dependencies?: string[];
}

// Tipos específicos para diferentes categorías de configuración

// Ubicaciones
export interface LocationValue {
    label: string;
    value: string;
}

export interface CityData extends LocationValue {
    department: string;
}

export interface DepartmentData extends LocationValue {
    cities: string[];
}

export interface CountryLocationConfig {
    country: LocationValue;
    departments: Record<string, DepartmentData & { cities: Record<string, LocationValue> }>;
}

// Textos
export interface TextConfig {
    [key: string]: string | TextConfig;
}

// Membresías
export interface MembershipFeature {
    id: string;
    name: string;
    description?: string;
    included: boolean;
}

export interface MembershipPlan {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    duration: number; // días
    features: MembershipFeature[];
    popular?: boolean;
    active: boolean;
    metadata?: {
        stripe_price_id?: string;
        paypal_plan_id?: string;
        [key: string]: any;
    };
}

export interface MembershipConfig {
    plans: MembershipPlan[];
    currencies: string[];
    default_currency: string;
    features: MembershipFeature[];
}

// Query types
export interface ConfigParameterQuery {
    category?: string;
    type?: ConfigParameterType;
    tags?: string[];
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ConfigParameterResponse {
    docs: ConfigParameter[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}

export interface ConfigParameterApiResponse extends ApiResponse<ConfigParameter> {}
export interface ConfigParametersApiResponse extends ApiResponse<ConfigParameterResponse> {}
export interface ConfigValueApiResponse extends ApiResponse<{ key: string; value: any }> {}
export interface ConfigValuesApiResponse extends ApiResponse<Record<string, any>> {}
export interface CategoriesApiResponse extends ApiResponse<string[]> {}
export interface TagsApiResponse extends ApiResponse<string[]> {}

// Form types para componentes
export interface ConfigParameterFormData {
    key: string;
    name: string;
    type: ConfigParameterType;
    category: string;
    value: any;
    description?: string;
    tags?: string[];
    dependencies?: string[];
    ui_config?: UIConfig;
    cache_ttl?: number;
    requires_restart?: boolean;
    environment?: 'development' | 'production' | 'all';
}

// Validation types
export interface ValidationRule {
    type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message?: string;
    validator?: (value: any) => boolean | Promise<boolean>;
}

export interface ConfigParameterValidation {
    [fieldPath: string]: ValidationRule[];
}

// Filter and sort options
export interface FilterOptions {
    categories: string[];
    types: ConfigParameterType[];
    tags: string[];
}

export interface SortOption {
    label: string;
    value: string;
    order: 'asc' | 'desc';
}

// Component props types
export interface ConfigParameterListProps {
    filters?: ConfigParameterQuery;
    onEdit?: (parameter: ConfigParameter) => void;
    onDelete?: (parameter: ConfigParameter) => void;
    onToggleActive?: (parameter: ConfigParameter) => void;
    selectable?: boolean;
    onSelectionChange?: (selected: ConfigParameter[]) => void;
}

export interface ConfigParameterFormProps {
    parameter?: ConfigParameter;
    onSubmit: (data: ConfigParameterFormData) => void;
    onCancel: () => void;
    loading?: boolean;
    mode: 'create' | 'edit';
}

export interface ConfigParameterCardProps {
    parameter: ConfigParameter;
    onEdit?: (parameter: ConfigParameter) => void;
    onDelete?: (parameter: ConfigParameter) => void;
    onToggleActive?: (parameter: ConfigParameter) => void;
    showActions?: boolean;
}

// Specialized component types
export interface LocationManagerProps {
    locationConfig?: CountryLocationConfig;
    onSave: (config: CountryLocationConfig) => void;
    loading?: boolean;
}

export interface TextManagerProps {
    textConfig?: TextConfig;
    onSave: (config: TextConfig) => void;
    loading?: boolean;
    translatable?: boolean;
}

export interface MembershipManagerProps {
    membershipConfig?: MembershipConfig;
    onSave: (config: MembershipConfig) => void;
    loading?: boolean;
}

// Hook return types
export interface UseConfigParametersResult {
    parameters: ConfigParameter[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    refetch: () => void;
    setFilters: (filters: ConfigParameterQuery) => void;
}

export interface UseConfigParameterResult {
    parameter: ConfigParameter | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export interface UseConfigValueResult<T = any> {
    value: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export interface UseConfigValuesResult {
    values: Record<string, any>;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Mutation types
export interface ConfigParameterMutations {
    create: (data: CreateConfigParameterInput) => Promise<ConfigParameter>;
    update: (id: string, data: UpdateConfigParameterInput) => Promise<ConfigParameter>;
    delete: (id: string) => Promise<void>;
    toggleActive: (id: string) => Promise<ConfigParameter>;
}

// Cache types
export interface ConfigParameterCache {
    key: string;
    value: any;
    ttl: number;
    lastUpdated: Date;
}

// Error types
export interface ConfigParameterError {
    code: string;
    message: string;
    field?: string;
    details?: any;
}