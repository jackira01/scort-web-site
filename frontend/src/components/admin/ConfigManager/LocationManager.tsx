'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Globe, Navigation } from 'lucide-react';
import { useLocationConfig, useCreateConfigParameter, useUpdateConfigParameter, useDeleteConfigParameter } from '../../../hooks/use-config-parameters';
import type { LocationConfig, ConfigParameterFormData } from '../../../types/config-parameter.types';

interface LocationFormData {
    key: string;
    name: string;
    description: string;
    country: string;
    state: string;
    city: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    timezone: string;
    currency: string;
    language: string;
    isDefault: boolean;
    isActive: boolean;
}

const DEFAULT_LOCATION: LocationFormData = {
    key: '',
    name: '',
    description: '',
    country: '',
    state: '',
    city: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    timezone: 'UTC',
    currency: 'USD',
    language: 'es',
    isDefault: false,
    isActive: true
};

export function LocationManager() {
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [formData, setFormData] = useState<LocationFormData>(DEFAULT_LOCATION);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { locations, loading, error, refetch } = useLocationConfig();
    const createMutation = useCreateConfigParameter();
    const updateMutation = useUpdateConfigParameter();
    const deleteMutation = useDeleteConfigParameter();

    const handleCreate = () => {
        setFormData(DEFAULT_LOCATION);
        setEditingLocation(null);
        setShowForm(true);
        setErrors({});
    };

    const handleEdit = (location: any) => {
        const locationValue = location.value as LocationConfig;
        setFormData({
            key: location.key,
            name: location.name,
            description: location.metadata?.description || '',
            country: locationValue.country,
            state: locationValue.state,
            city: locationValue.city,
            address: locationValue.address,
            coordinates: locationValue.coordinates,
            timezone: locationValue.timezone,
            currency: locationValue.currency,
            language: locationValue.language,
            isDefault: locationValue.isDefault || false,
            isActive: location.isActive
        });
        setEditingLocation(location);
        setShowForm(true);
        setErrors({});
    };

    const handleDelete = async (location: any) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la ubicación "${location.name}"?`)) {
            try {
                await deleteMutation.mutateAsync(location._id);
                refetch();
            } catch (error) {
          
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.key.trim()) {
            newErrors.key = 'La clave es requerida';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.key)) {
            newErrors.key = 'La clave solo puede contener letras, números, puntos, guiones y guiones bajos';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }

        if (!formData.country.trim()) {
            newErrors.country = 'El país es requerido';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'La ciudad es requerida';
        }

        if (isNaN(formData.coordinates.lat) || formData.coordinates.lat < -90 || formData.coordinates.lat > 90) {
            newErrors.lat = 'La latitud debe ser un número entre -90 y 90';
        }

        if (isNaN(formData.coordinates.lng) || formData.coordinates.lng < -180 || formData.coordinates.lng > 180) {
            newErrors.lng = 'La longitud debe ser un número entre -180 y 180';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const locationConfig: LocationConfig = {
                country: formData.country,
                state: formData.state,
                city: formData.city,
                address: formData.address,
                coordinates: formData.coordinates,
                timezone: formData.timezone,
                currency: formData.currency,
                language: formData.language,
                isDefault: formData.isDefault
            };

            const configData: ConfigParameterFormData = {
                key: formData.key,
                name: formData.name,
                type: 'location',
                category: 'locations',
                value: locationConfig,
                metadata: {
                    description: formData.description,
                    validation: {
                        required: true
                    },
                    ui_config: {
                        input_type: 'json',
                        help_text: 'Configuración de ubicación geográfica'
                    }
                },
                isActive: formData.isActive,
                tags: ['location', 'geography'],
                dependencies: []
            };

            if (editingLocation) {
                await updateMutation.mutateAsync({
                    id: editingLocation._id,
                    data: configData
                });
            } else {
                await createMutation.mutateAsync(configData);
            }

            setShowForm(false);
            setEditingLocation(null);
            refetch();
        } catch (error) {
      
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingLocation(null);
        setFormData(DEFAULT_LOCATION);
        setErrors({});
    };

    const isLoading = createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading;

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-red-600">
                    <p>Error cargando ubicaciones: {error}</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (showForm) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clave *
                            </label>
                            <input
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.key ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="ej: location.madrid"
                                disabled={!!editingLocation}
                            />
                            {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Madrid, España"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descripción de la ubicación"
                        />
                    </div>

                    {/* Ubicación geográfica */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <MapPin className="w-5 h-5 mr-2" />
                            Ubicación Geográfica
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    País *
                                </label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.country ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="España"
                                />
                                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado/Provincia
                                </label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Madrid"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ciudad *
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.city ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Madrid"
                                />
                                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Calle Gran Vía, 1"
                                />
                            </div>
                        </div>

                        {/* Coordenadas */}
                        <div className="mt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                                <Navigation className="w-4 h-4 mr-2" />
                                Coordenadas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Latitud *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.coordinates.lat}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            coordinates: { ...prev.coordinates, lat: parseFloat(e.target.value) || 0 }
                                        }))}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.lat ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="40.4168"
                                    />
                                    {errors.lat && <p className="mt-1 text-sm text-red-600">{errors.lat}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Longitud *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.coordinates.lng}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            coordinates: { ...prev.coordinates, lng: parseFloat(e.target.value) || 0 }
                                        }))}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.lng ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="-3.7038"
                                    />
                                    {errors.lng && <p className="mt-1 text-sm text-red-600">{errors.lng}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuración regional */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Globe className="w-5 h-5 mr-2" />
                            Configuración Regional
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zona Horaria
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="Europe/Madrid">Europe/Madrid</option>
                                    <option value="America/New_York">America/New_York</option>
                                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Moneda
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="USD">USD - Dólar</option>
                                    <option value="GBP">GBP - Libra</option>
                                    <option value="JPY">JPY - Yen</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Idioma
                                </label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Opciones */}
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Ubicación por defecto</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Ubicación activa</span>
                        </label>
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {editingLocation ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Ubicaciones</h2>
                    <p className="text-gray-600 mt-1">Administra las ubicaciones geográficas del sistema</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Ubicación</span>
                </button>
            </div>

            {/* Lista de ubicaciones */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {locations.length === 0 ? (
                    <div className="p-12 text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay ubicaciones configuradas
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Crea tu primera ubicación para comenzar.
                        </p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva Ubicación</span>
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {locations.map((location) => {
                            const locationValue = location.value as LocationConfig;
                            return (
                                <div key={location._id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {location.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {locationValue.city}, {locationValue.country}
                                                    </p>
                                                </div>
                                                {locationValue.isDefault && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Por defecto
                                                    </span>
                                                )}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    location.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {location.isActive ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </div>
                                            
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p><strong>Coordenadas:</strong> {locationValue.coordinates.lat}, {locationValue.coordinates.lng}</p>
                                                <p><strong>Zona horaria:</strong> {locationValue.timezone}</p>
                                                <p><strong>Moneda:</strong> {locationValue.currency} | <strong>Idioma:</strong> {locationValue.language}</p>
                                                {locationValue.address && (
                                                    <p><strong>Dirección:</strong> {locationValue.address}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(location)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(location)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}