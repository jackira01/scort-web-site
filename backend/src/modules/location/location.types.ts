import { Document, Types } from 'mongoose';

/**
 * Tipos de ubicación soportados
 */
export type LocationType =
    | 'country'      // Nivel 0: Colombia
    | 'department'   // Nivel 1: Antioquia, Bogotá
    | 'city'         // Nivel 2: Medellín, Chapinero
    | 'locality';    // Nivel 3: El Poblado, Usaquén

/**
 * Interface principal de Location
 */
export interface ILocation extends Document {
    _id: Types.ObjectId;
    value: string;        // Valor normalizado: "bogota", "medellin"
    label: string;        // Valor original: "Bogotá", "Medellín"
    type: LocationType;
    parentId?: Types.ObjectId;    // ID del padre (puede ser cualquier tipo)

    // Campos de optimización para queries
    path: string;         // "colombia/bogota/chapinero"
    level: number;        // 0=country, 1=department, 2=city, 3=locality
    ancestorIds: Types.ObjectId[]; // [countryId, departmentId] para queries rápidas

    // Control
    isActive: boolean;
    hasChildren?: boolean; // Indica si tiene subvalores
    order?: number;        // Para ordenar

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface para respuesta simplificada al frontend
 */
export interface LocationValue {
    value: string;
    label: string;
}

/**
 * Interface extendida para admin panel
 */
export interface LocationDetail extends LocationValue {
    type: LocationType;
    hasChildren?: boolean;
    level?: number;
}

/**
 * Interface para importación masiva
 */
export interface BulkLocationImport {
    country: {
        value: string;
        label: string;
    };
    departments: Array<{
        value: string;
        label: string;
        cities?: Array<{
            value: string;
            label: string;
            localities?: Array<{
                value: string;
                label: string;
            }>;
        }>;
    }>;
}

/**
 * Interface para creación de ubicación
 */
export interface CreateLocationDTO {
    value: string;
    label: string;
    type: LocationType;
    parentValue?: string;
    order?: number;
}
