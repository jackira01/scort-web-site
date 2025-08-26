"use client";

import React from "react";
import { OutputData } from "@editorjs/editorjs";
import Renderer from "editorjs-react-renderer";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Importar tipos de JSX para evitar errores de TypeScript
import type { JSX } from "react";

type BlogRendererProps = {
  content: OutputData;
  className?: string;
};

const BlogRenderer: React.FC<BlogRendererProps> = ({ content, className = "" }) => {
  // Validar que el contenido existe y tiene bloques
  if (!content || !content.blocks || content.blocks.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>No hay contenido disponible</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Configuración personalizada para el renderer
  const renderers = {
    header: ({ data }: any) => {
      const level = Math.min(Math.max(data.level || 2, 1), 6); // Asegurar que esté entre 1-6
      const tagName = `h${level}`;
      const levelClasses = {
        1: "text-4xl font-bold mb-6 text-foreground",
        2: "text-3xl font-semibold mb-5 text-foreground",
        3: "text-2xl font-semibold mb-4 text-foreground",
        4: "text-xl font-medium mb-3 text-foreground",
        5: "text-lg font-medium mb-2 text-foreground",
        6: "text-base font-medium mb-2 text-foreground"
      };
      
      return React.createElement(
        tagName,
        { 
          className: levelClasses[level as keyof typeof levelClasses] || levelClasses[2],
          dangerouslySetInnerHTML: { __html: data.text }
        }
      );
    },
    
    paragraph: ({ data }: any) => (
      <p 
        className="text-foreground leading-relaxed mb-4 text-base"
        dangerouslySetInnerHTML={{ __html: data.text }}
      />
    ),
    
    list: ({ data }: any) => {
      const Tag = data.style === 'ordered' ? 'ol' : 'ul';
      const listClass = data.style === 'ordered' 
        ? "list-decimal list-inside mb-4 space-y-2 text-foreground"
        : "list-disc list-inside mb-4 space-y-2 text-foreground";
      
      return (
        <Tag className={listClass}>
          {data.items.map((item: any, index: number) => {
            const content = typeof item === 'string' ? item : (item.content || item.text || JSON.stringify(item));
            return (
              <li 
                key={index} 
                className="text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            );
          })}
        </Tag>
      );
    },
    
    image: ({ data }: any) => (
      <figure className="mb-6">
        <div className="relative overflow-hidden rounded-lg border border-border">
          <img
            src={data.file.url}
            alt={data.caption || "Imagen del blog"}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
        {data.caption && (
          <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">
            {data.caption}
          </figcaption>
        )}
      </figure>
    ),
    
    quote: ({ data }: any) => (
      <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 bg-muted/50 rounded-r-lg">
        <p 
          className="text-lg italic text-foreground mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `"${data.text}"` }}
        />
        {data.caption && (
          <cite 
            className="text-sm text-muted-foreground font-medium"
            dangerouslySetInnerHTML={{ __html: `— ${data.caption}` }}
          />
        )}
      </blockquote>
    ),
    
    embed: ({ data }: any) => {
      // Manejar diferentes tipos de embeds
      if (data.service === 'youtube') {
        return (
          <div className="mb-6">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
              <iframe
                src={data.embed}
                title={data.caption || "Video de YouTube"}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
            {data.caption && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                {data.caption}
              </p>
            )}
          </div>
        );
      }
      
      // Para otros tipos de embed, mostrar un enlace
      return (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
          <a 
            href={data.source} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {data.caption || data.source}
          </a>
        </div>
      );
    },
    
    // Renderer por defecto para bloques no reconocidos
    default: ({ data }: any) => (
      <div className="mb-4 p-3 bg-muted/50 rounded border border-border">
        <p className="text-sm text-muted-foreground">
          Tipo de contenido no soportado: {data.type || 'desconocido'}
        </p>
      </div>
    )
  };

  try {
    return (
      <div className={`prose prose-lg max-w-none ${className}`}>
        <div className="space-y-1">
          <Renderer 
            data={content} 
            renderers={renderers}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error al renderizar el contenido del blog:', error);
    
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error al mostrar el contenido del blog</span>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default BlogRenderer;