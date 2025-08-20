'use client';

import React from 'react';
import { Edit, Trash2, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import { useDeleteConfigParameter, useToggleConfigParameterActive } from '../../../hooks/use-config-parameters';
import type { ConfigParameter } from '../../../types/config-parameter.types';

interface ConfigParameterListProps {
    parameters: ConfigParameter[];
    loading: boolean;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onEdit: (parameter: ConfigParameter) => void;
    onPageChange: (page: number) => void;
}

export function ConfigParameterList({
    parameters,
    loading,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onEdit,
    onPageChange
}: ConfigParameterListProps) {
    const deleteParameter = useDeleteConfigParameter();
    const toggleActive = useToggleConfigParameterActive();

    const handleDelete = async (parameter: ConfigParameter) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el parámetro "${parameter.name}"?`)) {
            try {
                await deleteParameter.mutateAsync(parameter._id);
            } catch (error) {
                console.error('Error deleting parameter:', error);
            }
        }
    };

    const handleToggleActive = async (parameter: ConfigParameter) => {
        try {
            await toggleActive.mutateAsync(parameter._id);
        } catch (error) {
            console.error('Error toggling parameter status:', error);
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        // Aquí podrías agregar una notificación toast
    };

    const getTypeColor = (type: string) => {
        const colors = {
            location: 'bg-green-100 text-green-800',
            text: 'bg-blue-100 text-blue-800',
            membership: 'bg-purple-100 text-purple-800',
            system: 'bg-gray-100 text-gray-800',
            app: 'bg-orange-100 text-orange-800'
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            locations: 'bg-emerald-100 text-emerald-800',
            texts: 'bg-sky-100 text-sky-800',
            memberships: 'bg-violet-100 text-violet-800',
            system: 'bg-slate-100 text-slate-800',
            app: 'bg-amber-100 text-amber-800'
        };
        return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const formatValue = (value: any, type: string) => {
        if (value === null || value === undefined) return 'N/A';
        
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2).substring(0, 100) + '...';
        }
        
        const stringValue = String(value);
        return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (parameters.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay parámetros de configuración
                    </h3>
                    <p className="text-gray-600">
                        Crea tu primer parámetro de configuración para comenzar.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                        Parámetros de Configuración
                    </h3>
                    <span className="text-sm text-gray-600">
                        {totalCount} parámetros en total
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Parámetro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Modificado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {parameters.map((parameter) => (
                            <tr key={parameter._id} className="hover:bg-gray-50">
                                {/* Parámetro */}
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {parameter.name}
                                        </div>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {parameter.key}
                                            </code>
                                            <button
                                                onClick={() => handleCopyKey(parameter.key)}
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Copiar clave"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {parameter.metadata?.description && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {parameter.metadata.description}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Tipo */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(parameter.type)}`}>
                                        {parameter.type}
                                    </span>
                                </td>

                                {/* Categoría */}
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(parameter.category)}`}>
                                        {parameter.category}
                                    </span>
                                </td>

                                {/* Valor */}
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-mono max-w-xs">
                                        {formatValue(parameter.value, parameter.type)}
                                    </div>
                                </td>

                                {/* Estado */}
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleActive(parameter)}
                                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                            parameter.isActive
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                        }`}
                                        disabled={toggleActive.isLoading}
                                    >
                                        {parameter.isActive ? (
                                            <Eye className="w-3 h-3" />
                                        ) : (
                                            <EyeOff className="w-3 h-3" />
                                        )}
                                        <span>{parameter.isActive ? 'Activo' : 'Inactivo'}</span>
                                    </button>
                                </td>

                                {/* Modificado */}
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {new Date(parameter.lastModified).toLocaleDateString('es-ES')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        por {parameter.modifiedBy?.name || 'Sistema'}
                                    </div>
                                </td>

                                {/* Acciones */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(parameter)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleDelete(parameter)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded"
                                            title="Eliminar"
                                            disabled={deleteParameter.isLoading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        
                                        {parameter.metadata?.ui_config?.external_link && (
                                            <a
                                                href={parameter.metadata.ui_config.external_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-600 hover:text-gray-800 p-1 rounded"
                                                title="Enlace externo"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Mostrando página {currentPage} de {totalPages}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={!hasPrevPage}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            
                            {/* Números de página */}
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                const pageNum = Math.max(1, currentPage - 2) + i;
                                if (pageNum > totalPages) return null;
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => onPageChange(pageNum)}
                                        className={`px-3 py-1 text-sm border rounded-md ${
                                            pageNum === currentPage
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={!hasNextPage}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}