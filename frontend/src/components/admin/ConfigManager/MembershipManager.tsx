'use client';

import React, { useState } from 'react';
import { Crown, Plus, Edit, Trash2, Star, Users, DollarSign, Clock } from 'lucide-react';
import { useMembershipConfig, useCreateConfigParameter, useUpdateConfigParameter, useDeleteConfigParameter } from '../../../hooks/use-config-parameters';
import type { MembershipConfig, ConfigParameterFormData } from '../../../types/config-parameter.types';

interface MembershipFormData {
    key: string;
    name: string;
    description: string;
    displayName: string;
    level: number;
    price: number;
    currency: string;
    duration: number;
    durationType: 'days' | 'months' | 'years';
    features: string[];
    limits: Record<string, number>;
    color: string;
    icon: string;
    isPopular: boolean;
    isActive: boolean;
}

const DEFAULT_MEMBERSHIP: MembershipFormData = {
    key: '',
    name: '',
    description: '',
    displayName: '',
    level: 1,
    price: 0,
    currency: 'COP',
    duration: 1,
    durationType: 'months',
    features: [],
    limits: {},
    color: '#3B82F6',
    icon: 'crown',
    isPopular: false,
    isActive: true
};

const CURRENCIES = [
    { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
    { code: 'USD', symbol: 'US$', name: 'Dólar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra' },
    { code: 'JPY', symbol: '¥', name: 'Yen' }
];

const DURATION_TYPES = [
    { value: 'days', label: 'Días' },
    { value: 'months', label: 'Meses' },
    { value: 'years', label: 'Años' }
];

const MEMBERSHIP_ICONS = [
    { value: 'crown', label: 'Corona', icon: '👑' },
    { value: 'star', label: 'Estrella', icon: '⭐' },
    { value: 'diamond', label: 'Diamante', icon: '💎' },
    { value: 'trophy', label: 'Trofeo', icon: '🏆' },
    { value: 'medal', label: 'Medalla', icon: '🏅' },
    { value: 'gem', label: 'Gema', icon: '💍' },
    { value: 'fire', label: 'Fuego', icon: '🔥' },
    { value: 'lightning', label: 'Rayo', icon: '⚡' }
];

const COMMON_FEATURES = [
    'Acceso prioritario',
    'Soporte 24/7',
    'Sin anuncios',
    'Funciones avanzadas',
    'Almacenamiento ilimitado',
    'Exportación de datos',
    'Integraciones premium',
    'Análisis detallados',
    'Personalización avanzada',
    'API access'
];

const COMMON_LIMITS = [
    { key: 'maxProjects', label: 'Máximo de proyectos' },
    { key: 'maxUsers', label: 'Máximo de usuarios' },
    { key: 'maxStorage', label: 'Almacenamiento (GB)' },
    { key: 'maxApiCalls', label: 'Llamadas API por mes' },
    { key: 'maxExports', label: 'Exportaciones por mes' }
];

export function MembershipManager() {
    const [showForm, setShowForm] = useState(false);
    const [editingMembership, setEditingMembership] = useState<any>(null);
    const [formData, setFormData] = useState<MembershipFormData>(DEFAULT_MEMBERSHIP);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newFeature, setNewFeature] = useState('');
    const [newLimitKey, setNewLimitKey] = useState('');
    const [newLimitValue, setNewLimitValue] = useState('');

    const { memberships, loading, error, refetch } = useMembershipConfig();
    const createMutation = useCreateConfigParameter();
    const updateMutation = useUpdateConfigParameter();
    const deleteMutation = useDeleteConfigParameter();

    const handleCreate = () => {
        setFormData(DEFAULT_MEMBERSHIP);
        setEditingMembership(null);
        setShowForm(true);
        setErrors({});
    };

    const handleEdit = (membership: any) => {
        const membershipValue = membership.value as MembershipConfig;
        setFormData({
            key: membership.key,
            name: membership.name,
            description: membership.metadata?.description || '',
            displayName: membershipValue.displayName,
            level: membershipValue.level,
            price: membershipValue.price,
            currency: membershipValue.currency,
            duration: membershipValue.duration,
            durationType: membershipValue.durationType,
            features: membershipValue.features || [],
            limits: membershipValue.limits || {},
            color: membershipValue.color || '#3B82F6',
            icon: membershipValue.icon || 'crown',
            isPopular: membershipValue.isPopular || false,
            isActive: membership.isActive
        });
        setEditingMembership(membership);
        setShowForm(true);
        setErrors({});
    };

    const handleDelete = async (membership: any) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la membresía "${membership.name}"?`)) {
            try {
                await deleteMutation.mutateAsync(membership._id);
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

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'El nombre de visualización es requerido';
        }

        if (formData.level < 1) {
            newErrors.level = 'El nivel debe ser mayor a 0';
        }

        if (formData.price < 0) {
            newErrors.price = 'El precio no puede ser negativo';
        }

        if (formData.duration < 1) {
            newErrors.duration = 'La duración debe ser mayor a 0';
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
            const membershipConfig: MembershipConfig = {
                displayName: formData.displayName,
                level: formData.level,
                price: formData.price,
                currency: formData.currency,
                duration: formData.duration,
                durationType: formData.durationType,
                features: formData.features,
                limits: formData.limits,
                color: formData.color,
                icon: formData.icon,
                isPopular: formData.isPopular
            };

            const configData: ConfigParameterFormData = {
                key: formData.key,
                name: formData.name,
                type: 'membership',
                category: 'memberships',
                value: membershipConfig,
                metadata: {
                    description: formData.description,
                    validation: {
                        required: true
                    },
                    ui_config: {
                        input_type: 'membership',
                        help_text: 'Configuración de plan de membresía'
                    }
                },
                isActive: formData.isActive,
                tags: ['membership', 'subscription', `level-${formData.level}`],
                dependencies: []
            };

            if (editingMembership) {
                await updateMutation.mutateAsync({
                    id: editingMembership._id,
                    data: configData
                });
            } else {
                await createMutation.mutateAsync(configData);
            }

            setShowForm(false);
            setEditingMembership(null);
            refetch();
        } catch (error) {
      
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingMembership(null);
        setFormData(DEFAULT_MEMBERSHIP);
        setErrors({});
    };

    const addFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const addLimit = () => {
        if (newLimitKey.trim() && newLimitValue.trim() && !isNaN(Number(newLimitValue))) {
            setFormData(prev => ({
                ...prev,
                limits: {
                    ...prev.limits,
                    [newLimitKey.trim()]: Number(newLimitValue)
                }
            }));
            setNewLimitKey('');
            setNewLimitValue('');
        }
    };

    const removeLimit = (key: string) => {
        setFormData(prev => {
            const newLimits = { ...prev.limits };
            delete newLimits[key];
            return {
                ...prev,
                limits: newLimits
            };
        });
    };

    const formatPrice = (price: number, currency: string) => {
        const currencyInfo = CURRENCIES.find(c => c.code === currency);
        return `${currencyInfo?.symbol || currency}${price}`;
    };

    const formatDuration = (duration: number, durationType: string) => {
        const typeInfo = DURATION_TYPES.find(t => t.value === durationType);
        return `${duration} ${typeInfo?.label.toLowerCase() || durationType}`;
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
                    <p>Error cargando membresías: {error}</p>
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
                        {editingMembership ? 'Editar Membresía' : 'Nueva Membresía'}
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
                                placeholder="ej: premium_plan"
                                disabled={!!editingMembership}
                            />
                            {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre interno *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Plan Premium"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de visualización *
                        </label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors.displayName ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Premium"
                        />
                        {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>}
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
                            placeholder="Descripción de la membresía"
                        />
                    </div>

                    {/* Configuración de precio y duración */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nivel *
                            </label>
                            <input
                                type="number"
                                value={formData.level}
                                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.level ? 'border-red-300' : 'border-gray-300'
                                }`}
                                min="1"
                            />
                            {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio *
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.price ? 'border-red-300' : 'border-gray-300'
                                }`}
                                min="0"
                                step="0.01"
                            />
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
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
                                {CURRENCIES.map(currency => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.symbol} {currency.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duración *
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.duration ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    min="1"
                                />
                                <select
                                    value={formData.durationType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, durationType: e.target.value as any }))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {DURATION_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                        </div>
                    </div>

                    {/* Apariencia */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icono
                            </label>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {MEMBERSHIP_ICONS.map(icon => (
                                    <option key={icon.value} value={icon.value}>
                                        {icon.icon} {icon.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Opciones */}
                    <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isPopular}
                                onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Plan popular</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Membresía activa</span>
                        </label>
                    </div>

                    {/* Características */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Características</h3>
                        
                        <div className="space-y-3">
                            {formData.features.map((feature, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                    <span className="text-sm text-gray-700">{feature}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex space-x-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nueva característica"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            />
                            <button
                                type="button"
                                onClick={addFeature}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Características comunes:</p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_FEATURES.filter(f => !formData.features.includes(f)).map(feature => (
                                    <button
                                        key={feature}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, features: [...prev.features, feature] }))}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        + {feature}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Límites */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Límites</h3>
                        
                        <div className="space-y-3">
                            {Object.entries(formData.limits).map(([key, value]) => {
                                const limitInfo = COMMON_LIMITS.find(l => l.key === key);
                                return (
                                    <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                        <span className="text-sm text-gray-700">
                                            {limitInfo?.label || key}: <strong>{value}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeLimit(key)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex space-x-2">
                            <input
                                type="text"
                                value={newLimitKey}
                                onChange={(e) => setNewLimitKey(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Clave del límite"
                            />
                            <input
                                type="number"
                                value={newLimitValue}
                                onChange={(e) => setNewLimitValue(e.target.value)}
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Valor"
                                min="0"
                            />
                            <button
                                type="button"
                                onClick={addLimit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Límites comunes:</p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_LIMITS.filter(l => !formData.limits[l.key]).map(limit => (
                                    <button
                                        key={limit.key}
                                        type="button"
                                        onClick={() => {
                                            setNewLimitKey(limit.key);
                                            setNewLimitValue('10');
                                        }}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        + {limit.label}
                                    </button>
                                ))}
                            </div>
                        </div>
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
                            {editingMembership ? 'Guardar' : 'Crear'}
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
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Membresías</h2>
                    <p className="text-gray-600 mt-1">Administra planes de membresía y suscripciones</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Membresía</span>
                </button>
            </div>

            {/* Lista de membresías */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {memberships.length === 0 ? (
                    <div className="p-12 text-center">
                        <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay membresías configuradas
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Crea tu primera membresía para comenzar.
                        </p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva Membresía</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {memberships.map((membership) => {
                            const membershipValue = membership.value as MembershipConfig;
                            const iconInfo = MEMBERSHIP_ICONS.find(i => i.value === membershipValue.icon);
                            
                            return (
                                <div 
                                    key={membership._id} 
                                    className={`relative bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
                                        membershipValue.isPopular 
                                            ? 'border-yellow-400 ring-2 ring-yellow-100' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    style={{ borderColor: membershipValue.isPopular ? '#FCD34D' : undefined }}
                                >
                                    {membershipValue.isPopular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                                <Star className="w-3 h-3" />
                                                <span>Popular</span>
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <div 
                                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                                            style={{ backgroundColor: `${membershipValue.color}20`, color: membershipValue.color }}
                                        >
                                            {iconInfo?.icon || '👑'}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {membershipValue.displayName}
                                        </h3>
                                        <div className="text-3xl font-bold mb-1" style={{ color: membershipValue.color }}>
                                            {formatPrice(membershipValue.price, membershipValue.currency)}
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            por {formatDuration(membershipValue.duration, membershipValue.durationType)}
                                        </p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {membershipValue.features.slice(0, 5).map((feature, index) => (
                                            <div key={index} className="flex items-center text-sm text-gray-700">
                                                <div 
                                                    className="w-4 h-4 rounded-full flex items-center justify-center mr-3 text-xs text-white"
                                                    style={{ backgroundColor: membershipValue.color }}
                                                >
                                                    ✓
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                        {membershipValue.features.length > 5 && (
                                            <p className="text-xs text-gray-500 ml-7">
                                                +{membershipValue.features.length - 5} características más
                                            </p>
                                        )}
                                    </div>

                                    {Object.keys(membershipValue.limits).length > 0 && (
                                        <div className="border-t border-gray-200 pt-4 mb-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Límites</h4>
                                            <div className="space-y-1">
                                                {Object.entries(membershipValue.limits).slice(0, 3).map(([key, value]) => {
                                                    const limitInfo = COMMON_LIMITS.find(l => l.key === key);
                                                    return (
                                                        <div key={key} className="flex justify-between text-xs text-gray-600">
                                                            <span>{limitInfo?.label || key}</span>
                                                            <span className="font-medium">{value}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                membership.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {membership.isActive ? 'Activa' : 'Inactiva'}
                                            </span>
                                            <span>Nivel {membershipValue.level}</span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(membership)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(membership)}
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