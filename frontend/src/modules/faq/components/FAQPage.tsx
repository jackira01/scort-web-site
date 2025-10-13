'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Search,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { usePublicContent } from '@/hooks/use-public-content';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener contenido dinámico del FAQ
  const { page, loading, error } = usePublicContent('faq');

  // Función para parsear contenido dinámico y convertirlo en FAQs
  const parseFAQsFromContent = (sections: any[]): FAQItem[] => {
    const faqItems: FAQItem[] = [];
    let idCounter = 1;

    sections.forEach(section => {
      section.blocks?.forEach((block: any) => {
        if (block.type === 'LIST' && block.value) {
          // Dividir por '?' para separar pregunta y respuesta
          const parts = block.value.split('?');
          if (parts.length >= 2) {
            const question = parts[0].trim() + '?';
            const answer = parts.slice(1).join('?').trim();
            
            if (question && answer) {
              faqItems.push({
                id: idCounter++,
                question,
                answer: answer || 'Información disponible próximamente.'
              });
            }
          }
        } else if (block.type === 'PARAGRAPH' && block.value) {
          // Buscar preguntas en párrafos que contengan palabras clave en español
          const text = block.value;
          const questionKeywords = ['¿qué', '¿cómo', '¿cuál', '¿cuánd', '¿dónd', '¿por qué', '¿para qué'];
          
          if (questionKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
            // Dividir por '?' para separar pregunta y respuesta
            const parts = text.split('?');
            if (parts.length >= 2) {
              const question = parts[0].trim() + '?';
              const answer = parts.slice(1).join('?').trim();
              
              faqItems.push({
                id: idCounter++,
                question,
                answer: answer || 'Información disponible próximamente.'
              });
            }
          }
        }
      });
    });

    return faqItems;
  };

  // Obtener FAQs del contenido
  const allFAQs = useMemo(() => {
    if (!page?.sections) return [];
    return parseFAQsFromContent(page.sections);
  }, [page]);

  // Filtrar FAQs por término de búsqueda
  const filteredFAQs = useMemo(() => {
    if (!searchTerm) return allFAQs;
    
    return allFAQs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFAQs, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando preguntas frecuentes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-6">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Error al cargar las preguntas frecuentes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No se pudieron cargar las preguntas frecuentes en este momento.
                </p>
                <Button onClick={() => router.push('/')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {page.title || 'Preguntas Frecuentes'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre nuestros servicios
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar en preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Preguntas y Respuestas
                  {searchTerm && (
                    <span className="text-sm font-normal text-gray-500">
                      ({filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq) => (
                    <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay preguntas disponibles'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Las preguntas frecuentes se cargarán próximamente'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;