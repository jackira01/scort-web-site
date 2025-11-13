export type LocationType = 'country' | 'department' | 'city' | 'locality';

export interface Location {
    _id: string;
    value: string;
    label: string;
    type: LocationType;
    parentId?: string;
    path: string;
    level: number;
    ancestorIds: string[];
    isActive: boolean;
    hasChildren?: boolean;
    order?: number;
    createdAt: string;
    updatedAt: string;
}

export interface LocationValue {
    value: string;
    label: string;
}

export interface LocationDetail extends LocationValue {
    type: LocationType;
    hasChildren?: boolean;
    level?: number;
}
