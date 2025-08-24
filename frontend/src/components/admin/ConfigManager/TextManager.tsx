'use client';

import React, { useState } from 'react';
import { Type, Plus, Edit, Trash2, Globe, Eye, EyeOff } from 'lucide-react';
import { useTextConfig, useCreateConfigParameter, useUpdateConfigParameter, useDeleteConfigParameter } from '../../../hooks/use-config-parameters';
import type { TextConfig, ConfigParameterFormData } from '../../../types/config-parameter.types';

interface TextFormData {
    key: string;
    name: string;
    description: string;
    content: Record<string, string>;
    defaultLanguage: string;
    category: string;
    isRichText: boolean;
    maxLength?: number;
    isActive: boolean;
}

const DEFAULT_TEXT: TextFormData = {
    key: '',
    name: '',
    description: '',
    content: { es: '', en: '' },
    defaultLanguage: 'es',
    category: 'general',
    isRichText: false,
    isActive: true
};

const LANGUAGES = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

const TEXT_CATEGORIES = [
    { value: 'general', label: 'General' },
    { value: 'ui', label: 'Interfaz de Usuario' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'legal', label: 'Legal' },
    { value: 'help', label: 'Ayuda' },
    { value: 'notifications', label: 'Notificaciones' },
    { value: 'emails', label: 'Emails' }
];

export function TextManager() {
    const [showForm, setShowForm] = useState(false);
    const [editingText, setEditingText] = useState<any>(null);
    const [formData, setFormData] = useState<TextFormData>(DEFAULT_TEXT);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeLanguage, setActiveLanguage] = useState('es');
    const [previewMode, setPreviewMode] = useState(false);

    const { texts, loading, error, refetch } = useTextConfig();
    const createMutation = useCreateConfigParameter();
    const updateMutation = useUpdateConfigParameter();
    const deleteMutation = useDeleteConfigParameter();

    const handleCreate = () => {
        setFormData(DEFAULT_TEXT);
        setEditingText(null);
        setShowForm(true);
        setErrors({});
        setActiveLanguage('es');
    };

    const handleEdit = (text: any) => {
        const textValue = text.value as TextConfig;
        setFormData({
            key: text.key,
            name: text.name,
            description: text.metadata?.description || '',
            content: textValue.content,
            defaultLanguage: textValue.defaultLanguage,
            category: textValue.category || 'general',
            isRichText: textValue.isRichText || false,
            maxLength: textValue.maxLength,
            isActive: text.isActive
        });
        setEditingText(text);
        setShowForm(true);
        setErrors({});
        setActiveLanguage(textValue.defaultLanguage);
    };

    const handleDelete = async (text: any) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el texto "${text.name}"?`)) {
            try {
                await deleteMutation.mutateAsync(text._id);
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

        if (!formData.content[formData.defaultLanguage]?.trim()) {
            newErrors.defaultContent = `El contenido en ${LANGUAGES.find(l => l.code === formData.defaultLanguage)?.name} es requerido`;
        }

        // Validar longitud máxima si está definida
        if (formData.maxLength) {
            Object.entries(formData.content).forEach(([lang, content]) => {
                if (content && content.length > formData.maxLength!) {
                    newErrors[`content_${lang}`] = `El contenido en ${LANGUAGES.find(l => l.code === lang)?.name} excede la longitud máxima de ${formData.maxLength} caracteres`;
                }
            });
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
            const textConfig: TextConfig = {
                content: formData.content,
                defaultLanguage: formData.defaultLanguage,
                category: formData.category,
                isRichText: formData.isRichText,
                maxLength: formData.maxLength
            };

            const configData: ConfigParameterFormData = {
                key: formData.key,
                name: formData.name,
                type: 'text',
                category: 'texts',
                value: textConfig,
                metadata: {
                    description: formData.description,
                    validation: {
                        required: true,
                        maxLength: formData.maxLength
                    },
                    ui_config: {
                        input_type: formData.isRichText ? 'textarea' : 'text',
                        help_text: 'Texto variable multiidioma',
                        rows: formData.isRichText ? 6 : undefined
                    }
                },
                isActive: formData.isActive,
                tags: ['text', 'i18n', formData.category],
                dependencies: []
            };

            if (editingText) {
                await updateMutation.mutateAsync({
                    id: editingText._id,
                    data: configData
                });
            } else {
                await createMutation.mutateAsync(configData);
            }

            setShowForm(false);
            setEditingText(null);
            refetch();
        } catch (error) {
      
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingText(null);
        setFormData(DEFAULT_TEXT);
        setErrors({});
        setActiveLanguage('es');
    };

    const handleContentChange = (language: string, content: string) => {
        setFormData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [language]: content
            }
        }));
        
        // Limpiar error específico del idioma
        if (errors[`content_${language}`]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[`content_${language}`];
                return newErrors;
            });
        }
    };

    const addLanguage = (languageCode: string) => {
        if (!formData.content[languageCode]) {
            setFormData(prev => ({
                ...prev,
                content: {
                    ...prev.content,
                    [languageCode]: ''
                }
            }));
        }
    };

    const removeLanguage = (languageCode: string) => {
        if (languageCode !== formData.defaultLanguage) {
            setFormData(prev => {
                const newContent = { ...prev.content };
                delete newContent[languageCode];
                return {
                    ...prev,
                    content: newContent
                };
            });
        }
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
                    <p>Error cargando textos: {error}</p>
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
                        {editingText ? 'Editar Texto' : 'Nuevo Texto'}
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
                                placeholder="ej: ui.welcome_message"
                                disabled={!!editingText}
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
                                placeholder="Mensaje de bienvenida"
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
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descripción del texto"
                        />
                    </div>

                    {/* Configuración */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Idioma por defecto
                            </label>
                            <select
                                value={formData.defaultLanguage}
                                onChange={(e) => setFormData(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {TEXT_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Longitud máxima
                            </label>
                            <input
                                type="number"
                                value={formData.maxLength || ''}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    maxLength: e.target.value ? parseInt(e.target.value) : undefined 
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Sin límite"
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Opciones */}
                    <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isRichText}
                                onChange={(e) => setFormData(prev => ({ ...prev, isRichText: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Texto enriquecido (HTML)</span>
                        </label>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Texto activo</span>
                        </label>
                    </div>

                    {/* Contenido multiidioma */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <Globe className="w-5 h-5 mr-2" />
                                Contenido Multiidioma
                            </h3>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                        previewMode
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    <span>{previewMode ? 'Editar' : 'Vista previa'}</span>
                                </button>
                                
                                <select
                                    value=""
                                    onChange={(e) => e.target.value && addLanguage(e.target.value)}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">+ Agregar idioma</option>
                                    {LANGUAGES.filter(lang => !formData.content[lang.code]).map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tabs de idiomas */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Object.keys(formData.content).map(langCode => {
                                const language = LANGUAGES.find(l => l.code === langCode);
                                const isDefault = langCode === formData.defaultLanguage;
                                const hasContent = formData.content[langCode]?.trim();
                                
                                return (
                                    <button
                                        key={langCode}
                                        type="button"
                                        onClick={() => setActiveLanguage(langCode)}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeLanguage === langCode
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span>{language?.flag || '🌐'}</span>
                                        <span>{language?.name || langCode}</span>
                                        {isDefault && (
                                            <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">
                                                Por defecto
                                            </span>
                                        )}
                                        {hasContent && (
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        )}
                                        {!isDefault && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeLanguage(langCode);
                                                }}
                                                className="text-gray-400 hover:text-red-600 ml-1"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Editor de contenido */}
                        <div className="space-y-4">
                            {Object.keys(formData.content).map(langCode => {
                                if (langCode !== activeLanguage) return null;
                                
                                const language = LANGUAGES.find(l => l.code === langCode);
                                const content = formData.content[langCode] || '';
                                const hasError = errors[`content_${langCode}`] || (langCode === formData.defaultLanguage && errors.defaultContent);
                                
                                return (
                                    <div key={langCode}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contenido en {language?.name || langCode}
                                            {langCode === formData.defaultLanguage && ' *'}
                                            {formData.maxLength && (
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({content.length}/{formData.maxLength})
                                                </span>
                                            )}
                                        </label>
                                        
                                        {previewMode ? (
                                            <div className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[100px] ${
                                                formData.isRichText ? 'prose' : 'whitespace-pre-wrap'
                                            }`}>
                                                {formData.isRichText ? (
                                                    <div dangerouslySetInnerHTML={{ __html: content }} />
                                                ) : (
                                                    content || <span className="text-gray-400">Sin contenido</span>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={content}
                                                onChange={(e) => handleContentChange(langCode, e.target.value)}
                                                rows={formData.isRichText ? 8 : 4}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    hasError ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder={`Contenido en ${language?.name || langCode}...`}
                                                maxLength={formData.maxLength}
                                            />
                                        )}
                                        
                                        {hasError && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors[`content_${langCode}`] || errors.defaultContent}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
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
                            {editingText ? 'Guardar' : 'Crear'}
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
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Textos</h2>
                    <p className="text-gray-600 mt-1">Administra textos variables y contenido multiidioma</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Texto</span>
                </button>
            </div>

            {/* Lista de textos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {texts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Type className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay textos configurados
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Crea tu primer texto variable para comenzar.
                        </p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Texto</span>
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {texts.map((text) => {
                            const textValue = text.value as TextConfig;
                            const defaultContent = textValue.content[textValue.defaultLanguage] || '';
                            const availableLanguages = Object.keys(textValue.content).filter(lang => textValue.content[lang]);
                            
                            return (
                                <div key={text._id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <Type className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {text.name}
                                                    </h3>
                                                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                        {text.key}
                                                    </code>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    TEXT_CATEGORIES.find(c => c.value === textValue.category)?.value === textValue.category
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {TEXT_CATEGORIES.find(c => c.value === textValue.category)?.label || textValue.category}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    text.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {text.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 mb-2">
                                                <p className="line-clamp-2">
                                                    {defaultContent.length > 100 
                                                        ? defaultContent.substring(0, 100) + '...' 
                                                        : defaultContent || 'Sin contenido'
                                                    }
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span>Idiomas: {availableLanguages.map(lang => {
                                                    const language = LANGUAGES.find(l => l.code === lang);
                                                    return language ? `${language.flag} ${language.name}` : lang;
                                                }).join(', ')}</span>
                                                {textValue.maxLength && (
                                                    <span>Máx: {textValue.maxLength} chars</span>
                                                )}
                                                {textValue.isRichText && (
                                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">HTML</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(text)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(text)}
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