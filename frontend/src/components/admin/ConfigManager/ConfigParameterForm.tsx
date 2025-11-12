'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useCreateConfigParameter, useUpdateConfigParameter } from '../../../hooks/use-config-parameters';
import type { ConfigParameter, ConfigParameterFormData, ConfigParameterType, UIConfig } from '../../../types/config-parameter.types';

interface ConfigParameterFormProps {
    parameter?: ConfigParameter | null;
    onSubmit: (data: ConfigParameterFormData) => void;
    onCancel: () => void;
    mode: 'create' | 'edit';
}

const PARAMETER_TYPES: { value: ConfigParameterType; label: string; description: string }[] = [
    { value: 'location', label: 'Ubicación', description: 'Configuración de ubicaciones geográficas' },
    { value: 'text', label: 'Texto', description: 'Textos variables y contenido dinámico' },
    { value: 'membership', label: 'Membresía', description: 'Configuración de planes de membresía' },
    { value: 'system', label: 'Sistema', description: 'Configuración del sistema' },
    { value: 'app', label: 'Aplicación', description: 'Configuración de la aplicación' }
];

const DEFAULT_CATEGORIES = {
    location: 'locations',
    text: 'texts',
    membership: 'memberships',
    number: 'numbers',
    boolean: 'booleans',
    array: 'arrays',
    object: 'objects',
    json: 'json',
    system: 'system',
    app: 'app'
};

export function ConfigParameterForm({
    parameter,
    onSubmit,
    onCancel,
    mode
}: ConfigParameterFormProps) {
    const [formData, setFormData] = useState<ConfigParameterFormData>({
        key: '',
        name: '',
        type: 'text',
        category: 'texts',
        value: '',
        metadata: {
            description: '',
            validation: {},
            ui_config: {
                input_type: 'text',
                placeholder: '',
                help_text: ''
            }
        },
        isActive: true,
        tags: [],
        dependencies: []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newTag, setNewTag] = useState('');
    const [newDependency, setNewDependency] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createMutation = useCreateConfigParameter();
    const updateMutation = useUpdateConfigParameter();

    // Cargar datos del parámetro en modo edición
    useEffect(() => {
        if (mode === 'edit' && parameter) {
            setFormData({
                key: parameter.key,
                name: parameter.name,
                type: parameter.type,
                category: parameter.category,
                value: typeof parameter.value === 'object'
                    ? JSON.stringify(parameter.value, null, 2)
                    : String(parameter.value),
                metadata: {
                    description: parameter.metadata?.description || '',
                    validation: parameter.metadata?.validation || {},
                    ui_config: {
                        input_type: parameter.metadata?.ui_config?.input_type || 'text',
                        placeholder: parameter.metadata?.ui_config?.placeholder || '',
                        help_text: parameter.metadata?.ui_config?.help_text || '',
                        options: parameter.metadata?.ui_config?.options || [],
                        min: parameter.metadata?.ui_config?.min,
                        max: parameter.metadata?.ui_config?.max,
                        step: parameter.metadata?.ui_config?.step,
                        rows: parameter.metadata?.ui_config?.rows,
                        external_link: parameter.metadata?.ui_config?.external_link
                    },
                    cache_ttl: parameter.metadata?.cache_ttl,
                    requires_restart: parameter.metadata?.requires_restart || false,
                    environment: parameter.metadata?.environment
                },
                isActive: parameter.isActive,
                tags: parameter.tags || [],
                dependencies: parameter.dependencies || []
            });
        }
    }, [mode, parameter]);

    // Actualizar categoría cuando cambia el tipo
    const handleTypeChange = (type: ConfigParameterType) => {
        setFormData(prev => ({
            ...prev,
            type,
            category: DEFAULT_CATEGORIES[type]
        }));
    };

    const handleInputChange = (field: keyof ConfigParameterFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleMetadataChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                description: prev.metadata?.description,
                validation: prev.metadata?.validation || {},
                ui_config: prev.metadata?.ui_config || {},
                cache_ttl: prev.metadata?.cache_ttl,
                requires_restart: prev.metadata?.requires_restart,
                environment: prev.metadata?.environment,
                [field]: value
            }
        }));
    };

    const handleUIConfigChange = (field: keyof UIConfig, value: any) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                ui_config: {
                    ...(prev.metadata?.ui_config || {}),
                    [field]: value
                }
            }
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove)
        }));
    };

    const addDependency = () => {
        if (newDependency.trim() && !formData.dependencies?.includes(newDependency.trim())) {
            setFormData(prev => ({
                ...prev,
                dependencies: [...(prev.dependencies || []), newDependency.trim()]
            }));
            setNewDependency('');
        }
    };

    const removeDependency = (depToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            dependencies: (prev.dependencies || []).filter(dep => dep !== depToRemove)
        }));
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

        if (!formData.category.trim()) {
            newErrors.category = 'La categoría es requerida';
        }

        // Validar JSON si el tipo de entrada es JSON
        if (formData.metadata?.ui_config?.input_type === 'json') {
            try {
                JSON.parse(formData.value as string);
            } catch {
                newErrors.value = 'El valor debe ser un JSON válido';
            }
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
            setIsLoading(true);
            // Procesar el valor según el tipo
            let processedValue: any = formData.value;

            if (formData.metadata?.ui_config?.input_type === 'json') {
                processedValue = JSON.parse(formData.value as string);
            } else if (formData.metadata?.ui_config?.input_type === 'number') {
                processedValue = Number(formData.value);
            } else if (formData.metadata?.ui_config?.input_type === 'checkbox') {
                processedValue = Boolean(formData.value);
            }

            const submitData = {
                ...formData,
                value: processedValue
            };

            if (mode === 'create') {
                await createMutation.mutateAsync(submitData);
            } else if (parameter) {
                await updateMutation.mutateAsync({
                    id: parameter._id,
                    data: submitData
                });
            }

            onSubmit(submitData);
        } catch (error) {
            console.error('Error al guardar:', error);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">
                        {mode === 'create' ? 'Crear Parámetro' : 'Editar Parámetro'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Clave */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Clave *
                        </label>
                        <input
                            type="text"
                            value={formData.key}
                            onChange={(e) => handleInputChange('key', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.key ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="ej: app.title"
                            disabled={mode === 'edit'}
                        />
                        {errors.key && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.key}
                            </p>
                        )}
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Nombre descriptivo"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Tipo *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleTypeChange(e.target.value as ConfigParameterType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {PARAMETER_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            {PARAMETER_TYPES.find(t => t.value === formData.type)?.description}
                        </p>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Categoría *
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Categoría del parámetro"
                        />
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.category}
                            </p>
                        )}
                    </div>
                </div>

                {/* Descripción */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Descripción
                    </label>
                    <textarea
                        value={formData.metadata?.description}
                        onChange={(e) => handleMetadataChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción del parámetro"
                    />
                </div>

                {/* Configuración de UI */}
                <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-gray-300">Configuración de Interfaz</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo de entrada */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                Tipo de entrada
                            </label>
                            <select
                                value={formData.metadata?.ui_config?.input_type}
                                onChange={(e) => handleUIConfigChange('input_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="text">Texto</option>
                                <option value="textarea">Área de texto</option>
                                <option value="number">Número</option>
                                <option value="email">Email</option>
                                <option value="url">URL</option>
                                <option value="password">Contraseña</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="select">Select</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>

                        {/* Placeholder */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                Placeholder
                            </label>
                            <input
                                type="text"
                                value={formData.metadata?.ui_config?.placeholder}
                                onChange={(e) => handleUIConfigChange('placeholder', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Texto de ayuda"
                            />
                        </div>
                    </div>

                    {/* Texto de ayuda */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                            Texto de ayuda
                        </label>
                        <input
                            type="text"
                            value={formData.metadata?.ui_config?.help_text}
                            onChange={(e) => handleUIConfigChange('help_text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Información adicional para el usuario"
                        />
                    </div>
                </div>

                {/* Valor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Valor *
                    </label>
                    {formData.metadata?.ui_config?.input_type === 'textarea' || formData.metadata?.ui_config?.input_type === 'json' ? (
                        <textarea
                            value={formData.value as string}
                            onChange={(e) => handleInputChange('value', e.target.value)}
                            rows={formData.metadata.ui_config.input_type === 'json' ? 6 : 4}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${errors.value ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder={formData.metadata.ui_config.placeholder || 'Valor del parámetro'}
                        />
                    ) : formData.metadata?.ui_config?.input_type === 'checkbox' ? (
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={Boolean(formData.value)}
                                onChange={(e) => handleInputChange('value', e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Activado</span>
                        </label>
                    ) : (
                        <input
                            type={formData.metadata?.ui_config?.input_type || 'text'}
                            value={formData.value as string}
                            onChange={(e) => handleInputChange('value', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.value ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder={formData.metadata?.ui_config?.placeholder || 'Valor del parámetro'}
                        />
                    )}
                    {errors.value && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.value}
                        </p>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                        Etiquetas
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {(formData.tags || []).map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nueva etiqueta"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Estado */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Parámetro activo
                    </label>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        <Save className="w-4 h-4" />
                        <span>{mode === 'create' ? 'Crear' : 'Guardar'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}