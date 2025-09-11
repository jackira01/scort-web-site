"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import toast from 'react-hot-toast';

// Importaciones dinámicas para evitar errores de tipos
const Header = require("@editorjs/header");
const List = require("@editorjs/list");
const ImageTool = require("@editorjs/image");
const Quote = require("@editorjs/quote");
const Embed = require("@editorjs/embed");
// Nota: Paragraph ya está incluido en el core de EditorJS, no necesita importación

type BlogEditorProps = {
  initialData?: OutputData; // Para edición
  isLoading?: boolean; // Estado de carga
  className?: string;
  deferredUpload?: {
    addPendingFile: (file: File, type: string) => { id: string; preview: string };
    uploadAllPendingFiles: (folder: string) => Promise<Record<string, string>>;
  };
};

// Nota: onChange fue removido para evitar bucles infinitos de re-renderizado
// El contenido se obtiene directamente usando la ref cuando se necesita

export type BlogEditorRef = {
  getData: () => Promise<OutputData>;
};

const BlogEditor = forwardRef<BlogEditorRef, BlogEditorProps>((
  {
    initialData,
    isLoading = false,
    className = "",
    deferredUpload
  },
  ref
) => {
  const editorRef = useRef<EditorJS | null>(null);
  const editorId = useRef(`editorjs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  const [isReady, setIsReady] = useState(false);
  const isInitializedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getData: async () => {
      if (editorRef.current) {
        return await editorRef.current.save();
      }
      throw new Error("Editor no está inicializado");
    },
  }), []);

  useEffect(() => {
    // Solo inicializar en el cliente y si no existe ya un editor
    if (typeof window === "undefined" || editorRef.current || isInitializedRef.current) return;

    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    const initializeEditor = () => {
      // Verificar que el elemento DOM existe antes de inicializar
      const holderElement = document.getElementById(editorId.current);
      if (!holderElement) {
        // Editor holder element not found
        return;
      }

      isInitializedRef.current = true;

    const editor = new EditorJS({
      holder: editorId.current,
      autofocus: false,
      data: initialData || undefined,
      placeholder: "Comienza a escribir tu blog aquí...",
      // Configuración global de herramientas inline
      inlineToolbar: ['link', 'bold', 'italic'],
      tools: {
        // Paragraph ya está incluido por defecto en EditorJS
        header: {
          class: Header,
          inlineToolbar: ['link', 'bold', 'italic'],
          config: {
            placeholder: "Ingresa un encabezado",
            levels: [1, 2, 3, 4],
            defaultLevel: 2
          }
        },
        list: {
          class: List,
          inlineToolbar: ['link', 'bold', 'italic'],
          config: {
            defaultStyle: 'unordered'
          }
        },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                try {
                  // Validar tipo de archivo
                  if (!file.type.startsWith('image/')) {
                    throw new Error('Solo se permiten archivos de imagen');
                  }

                  // Validar tamaño (máximo 10MB)
                  if (file.size > 10 * 1024 * 1024) {
                    throw new Error('El archivo es demasiado grande. Máximo 10MB.');
                  }

                  // Si hay sistema de subida diferida, usarlo
                  if (deferredUpload) {
                    const { id, preview } = deferredUpload.addPendingFile(file, 'image');
                    toast.success('Imagen agregada - Se subirá al guardar el blog.');
                    
                    return {
                      success: 1,
                      file: {
                        url: preview,
                        // Agregar metadatos temporales
                        width: 800, // Valor por defecto
                        height: 600, // Valor por defecto
                        size: file.size,
                        // Guardar el ID para referencia posterior
                        pendingId: id
                      },
                    };
                  }

                  // Fallback: subir directamente a Cloudinary
                  const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
                  const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || "";

                  if (!upload_preset || !cloud_name) {
                    throw new Error('Configuración de Cloudinary no encontrada');
                  }

                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('upload_preset', upload_preset);
                  formData.append('folder', 'blog-images');

                  const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
                    {
                      method: 'POST',
                      body: formData,
                    }
                  );

                  if (!response.ok) {
                    throw new Error('Error al subir la imagen a Cloudinary');
                  }

                  const result = await response.json();

                  return {
                    success: 1,
                    file: {
                      url: result.secure_url,
                      width: result.width,
                      height: result.height,
                      size: result.bytes
                    },
                  };
                } catch (error) {
                  // Error al subir imagen
                  toast.error(`Error al subir imagen: ${error instanceof Error ? error.message : 'Error al subir la imagen'}`);
                  return {
                    success: 0,
                    message: error instanceof Error ? error.message : 'Error al subir la imagen'
                  };
                }
              }
            },
            captionPlaceholder: "Ingresa una descripción para la imagen"
          },
        },
        quote: {
          class: Quote,
          inlineToolbar: ['link', 'bold', 'italic'],
          config: {
            quotePlaceholder: 'Ingresa una cita',
            captionPlaceholder: 'Autor de la cita',
          },
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true,
              instagram: true,
              codepen: true,
              github: true
            }
          }
        },
      },
      onReady: () => {
        setIsReady(true);
      },
      // onChange removido para evitar problemas de reinicio del editor
      // El contenido se guardará solo cuando el usuario haga submit
    });
    
    editorRef.current = editor;
    };

    // Usar setTimeout para asegurar que el DOM esté listo
    const timeoutId = setTimeout(initializeEditor, 100);

    return () => {
      clearTimeout(timeoutId);
      if (typeof window !== 'undefined' && editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
        setIsReady(false);
        isInitializedRef.current = false;
      }
    };
  }, []); // Sin dependencias para evitar re-renders innecesarios

  // Efecto separado para actualizar el contenido cuando cambia initialData
  useEffect(() => {
    if (editorRef.current && initialData && isReady) {
      // Solo actualizar si el editor está listo y hay datos iniciales
      editorRef.current.render(initialData).catch(() => {});
    }
  }, [initialData, isReady]);

  if (typeof window === "undefined") {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="min-h-[400px] border border-border rounded-lg p-4 bg-background flex items-center justify-center">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Inicializando editor...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Editor Container */}
          <div
            id={editorId.current}
            className="min-h-[400px] border border-border rounded-lg p-4 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all"
          />

          {/* Loading State */}
          {!isReady && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Cargando editor...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

BlogEditor.displayName = "BlogEditor";

export default BlogEditor;
