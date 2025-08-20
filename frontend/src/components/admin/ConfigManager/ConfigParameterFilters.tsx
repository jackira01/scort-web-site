'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { ConfigParameterQuery } from '../../../types/config-parameter.types';

interface ConfigParameterFiltersProps {
    filters: ConfigParameterQuery;
    categories: string[];
    tags: string[];
    onChange: (filters: Partial<ConfigParameterQuery>) => void;
}

const PARAMETER_TYPES = [
    { value: 'location', label: 'Ubicación' },
    { value: 'text', label: 'Texto' },
    { value: 'membership', label: 'Membresía' },
    { value: 'system', label: 'Sistema' },
    { value: 'app', label: 'Aplicación' }
];

const SORT_OPTIONS = [
    { value: 'name', label: 'Nombre' },
    { value: 'key', label: 'Clave' },
    { value: 'type', label: 'Tipo' },
    { value: 'category', label: 'Categoría' },
    { value: 'lastModified', label: 'Última modificación' },
    { value: 'createdAt', label: 'Fecha de creación' }
];

export function ConfigParameterFilters({
    filters,
    categories,
    tags,
    onChange
}: ConfigParameterFiltersProps) {
    const handleFilterChange = (key: keyof ConfigParameterQuery, value: any) => {
        onChange({ [key]: value });
    };

    const handleTagToggle = (tag: string) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        
        onChange({ tags: newTags.length > 0 ? newTags : undefined });
    };

    const clearFilters = () => {
        onChange({
            type: undefined,
            category: undefined,
            isActive: undefined,
            tags: undefined,
            sortBy: 'name',
            sortOrder: 'asc'
        });
    };

    const hasActiveFilters = !!
        (filters.type || filters.category || filters.isActive !== undefined || filters.tags?.length);

    return (
        <div className="space-y-4">
            {/* Filtros principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tipo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                    </label>
                    <select
                        value={filters.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos los tipos</option>
                        {PARAMETER_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Categoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                    </label>
                    <select
                        value={filters.category || ''}
                        onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Estado */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                    </label>
                    <select
                        value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                        onChange={(e) => {
                            const value = e.target.value;
                            handleFilterChange('isActive', value === '' ? undefined : value === 'true');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos los estados</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                </div>

                {/* Ordenar por */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ordenar por
                    </label>
                    <div className="flex space-x-2">
                        <select
                            value={filters.sortBy || 'name'}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {SORT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        
                        <select
                            value={filters.sortOrder || 'asc'}
                            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="asc">↑ Asc</option>
                            <option value="desc">↓ Desc</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Etiquetas
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => {
                            const isSelected = filters.tags?.includes(tag) || false;
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {tag}
                                    {isSelected && (
                                        <X className="inline-block w-3 h-3 ml-1" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Límite de resultados */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">
                        Resultados por página:
                    </label>
                    <select
                        value={filters.limit || 20}
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                {/* Limpiar filtros */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        <span>Limpiar filtros</span>
                    </button>
                )}
            </div>

            {/* Resumen de filtros activos */}
            {hasActiveFilters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">Filtros activos:</span>
                        {filters.type && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Tipo: {PARAMETER_TYPES.find(t => t.value === filters.type)?.label}
                            </span>
                        )}
                        {filters.category && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Categoría: {filters.category}
                            </span>
                        )}
                        {filters.isActive !== undefined && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Estado: {filters.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        )}
                        {filters.tags && filters.tags.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Etiquetas: {filters.tags.join(', ')}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}