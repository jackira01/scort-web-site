'use client';

import {
    Download,
    Filter,
    Plus,
    RefreshCw,
    Search,
    Upload,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    useConfigCategories,
    useConfigParameters,
    useConfigTags,
} from '../../../hooks/use-config-parameters';
import type {
    ConfigParameter,
    ConfigParameterFormData,
    ConfigParameterQuery,
} from '../../../types/config-parameter.types';
import { ConfigParameterFilters } from './ConfigParameterFilters';
import { ConfigParameterForm } from './ConfigParameterForm';
import { ConfigParameterList } from './ConfigParameterList';
import { LocationManager } from './LocationManager';
import { MembershipManager } from './MembershipManager';
import { TextManager } from './TextManager';

type ViewMode =
    | 'list'
    | 'create'
    | 'edit'
    | 'locations'
    | 'texts'
    | 'memberships';

interface ConfigManagerProps {
    className?: string;
}

export function ConfigManager({ className = '' }: ConfigManagerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedParameter, setSelectedParameter] =
        useState<ConfigParameter | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<ConfigParameterQuery>({
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
    });

    // Aplicar filtros con búsqueda
    const appliedFilters = useMemo(
        () => ({
            ...filters,
            search: searchTerm || undefined,
        }),
        [filters, searchTerm],
    );

    const {
        parameters,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        refetch,
        setFilters: updateFilters,
    } = useConfigParameters(appliedFilters);

    const { categories } = useConfigCategories();
    const { tags } = useConfigTags();

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        updateFilters({ ...filters, page: 1 });
    };

    const handleFilterChange = (newFilters: Partial<ConfigParameterQuery>) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);
        updateFilters(updatedFilters);
    };

    const handlePageChange = (page: number) => {
        const updatedFilters = { ...filters, page };
        setFilters(updatedFilters);
        updateFilters(updatedFilters);
    };

    const handleEdit = (parameter: ConfigParameter) => {
        setSelectedParameter(parameter);
        setViewMode('edit');
    };

    const handleCreate = () => {
        setSelectedParameter(null);
        setViewMode('create');
    };

    const handleFormSubmit = async (data: ConfigParameterFormData) => {
        // La lógica de submit se maneja en el componente Form
        // Después del éxito, volver a la lista
        setViewMode('list');
        setSelectedParameter(null);
        refetch();
    };

    const handleFormCancel = () => {
        setViewMode('list');
        setSelectedParameter(null);
    };

    const handleExport = async () => {
        try {
            // Implementar exportación
            console.log('Exporting configurations...');
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleImport = async (file: File) => {
        try {
            // Implementar importación
            console.log('Importing configurations...', file);
        } catch (error) {
            console.error('Import failed:', error);
        }
    };

    const renderHeader = () => (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Gestión de Configuración
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Administra parámetros de configuración del sistema
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setViewMode('locations')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'locations'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Ubicaciones
                    </button>

                    <button
                        onClick={() => setViewMode('texts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'texts'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Textos
                    </button>

                    <button
                        onClick={() => setViewMode('memberships')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'memberships'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Membresías
                    </button>

                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todos los Parámetros
                    </button>
                </div>
            </div>
        </div>
    );

    const renderListControls = () => (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar parámetros..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                        />
                    </div>

                    {/* Filtros */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filtros</span>
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => refetch()}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Export/Import */}
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar</span>
                    </button>

                    <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Importar</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={(e) =>
                                e.target.files?.[0] && handleImport(e.target.files[0])
                            }
                            className="hidden"
                        />
                    </label>

                    {/* Crear nuevo */}
                    <button
                        onClick={handleCreate}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Parámetro</span>
                    </button>
                </div>
            </div>

            {/* Filtros expandibles */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <ConfigParameterFilters
                        filters={filters}
                        categories={categories}
                        tags={tags}
                        onChange={handleFilterChange}
                    />
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (viewMode) {
            case 'create':
            case 'edit':
                return (
                    <div className="p-6">
                        <ConfigParameterForm
                            parameter={selectedParameter}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            mode={viewMode}
                        />
                    </div>
                );

            case 'locations':
                return (
                    <div className="p-6">
                        <LocationManager />
                    </div>
                );

            case 'texts':
                return (
                    <div className="p-6">
                        <TextManager />
                    </div>
                );

            case 'memberships':
                return (
                    <div className="p-6">
                        <MembershipManager />
                    </div>
                );

            default:
                return (
                    <>
                        {renderListControls()}
                        <div className="p-6">
                            {error ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-800">Error: {error}</p>
                                    <button
                                        onClick={() => refetch()}
                                        className="mt-2 text-red-600 hover:text-red-800 underline"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : (
                                <ConfigParameterList
                                    parameters={parameters}
                                    loading={loading}
                                    totalCount={totalCount}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    hasNextPage={hasNextPage}
                                    hasPrevPage={hasPrevPage}
                                    onEdit={handleEdit}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </div>
                    </>
                );
        }
    };

    return (
        <div className={`bg-gray-50 min-h-screen ${className}`}>
            {renderHeader()}
            {renderContent()}
        </div>
    );
}

export default ConfigManager;
