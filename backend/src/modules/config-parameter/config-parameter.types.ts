import type { Document, Model, Query, Types } from 'mongoose';

export type ConfigParameterType =
    | 'location'
    | 'text'
    | 'membership'
    | 'system'
    | 'app'
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

export interface IConfigParameter extends Document {
    key: string;
    name: string;
    type: ConfigParameterType;
    category: string;
    value: any;
    metadata?: ConfigMetadata;
    isActive: boolean;
    version: number;
    lastModified: Date;
    modifiedBy: Types.ObjectId;
    tags?: string[];
    dependencies?: string[];
    createdAt: Date;
    updatedAt: Date;

    // Virtuals
    hasHistory: boolean;

    // Methods
    validateDependencies(): Promise<boolean>;
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
    modifiedBy: string; // ObjectId as string
}

export interface UpdateConfigParameterInput {
    name?: string;
    value?: any;
    metadata?: ConfigMetadata;
    isActive?: boolean;
    tags?: string[];
    dependencies?: string[];
    modifiedBy: string; // ObjectId as string
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
    departments: Record<
        string,
        DepartmentData & { cities: Record<string, LocationValue> }
    >;
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
    docs: IConfigParameterLean[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}

// Validation schemas
export interface ValidationRule {
    type:
    | 'required'
    | 'minLength'
    | 'maxLength'
    | 'min'
    | 'max'
    | 'pattern'
    | 'custom';
    value?: any;
    message?: string;
    validator?: (value: any) => boolean | Promise<boolean>;
}

export interface ConfigParameterValidation {
    [fieldPath: string]: ValidationRule[];
}

// Cache types
export interface ConfigParameterCache {
    key: string;
    value: any;
    ttl: number;
    lastUpdated: Date;
}

// Audit types
export interface ConfigParameterAudit {
    parameterId: Types.ObjectId;
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
    oldValue?: any;
    newValue?: any;
    modifiedBy: Types.ObjectId;
    timestamp: Date;
    metadata?: Record<string, any>;
}

// Lean version of IConfigParameter (plain object without Document methods)
export type IConfigParameterLean = {
    _id: any;
    key: string;
    name: string;
    type: ConfigParameterType;
    category: string;
    value: any;
    metadata?: ConfigMetadata;
    isActive: boolean;
    version: number;
    lastModified: Date;
    modifiedBy: any;
    tags?: string[];
    dependencies?: string[];
    createdAt: Date;
    updatedAt: Date;
    hasHistory: boolean;
    __v?: number;
};

// Model interface with static methods
export interface IConfigParameterModel extends Model<IConfigParameter> {
    findByCategory(
        category: string,
        activeOnly?: boolean,
    ): Query<IConfigParameter[], IConfigParameter>;
    findByType(
        type: ConfigParameterType,
        activeOnly?: boolean,
    ): Query<IConfigParameter[], IConfigParameter>;
    findByTags(
        tags: string[],
        activeOnly?: boolean,
    ): Query<IConfigParameter[], IConfigParameter>;
    findByCategoryLean(
        category: string,
        activeOnly?: boolean,
    ): Query<IConfigParameterLean[], IConfigParameter>;
    findByTypeLean(
        type: ConfigParameterType,
        activeOnly?: boolean,
    ): Query<IConfigParameterLean[], IConfigParameter>;
    findByTagsLean(
        tags: string[],
        activeOnly?: boolean,
    ): Query<IConfigParameterLean[], IConfigParameter>;
}
