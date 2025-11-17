'use client';

import React from 'react';
import { ArrowLeft, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import ContentRenderer from '@/components/admin/content/ContentRenderer';
import { usePublicContent } from '@/hooks/use-public-content';

interface PublicContentPageProps {
  slug: string;
  fallbackContent?: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
}

const PublicContentPage: React.FC<PublicContentPageProps> = ({
  slug,
  fallbackContent,
  showBackButton = true,
  backButtonText = 'Volver al inicio',
  backButtonHref = '/'
}) => {
  const { page, loading, error } = usePublicContent(slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-8">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            {showBackButton && (
              <Link href={backButtonHref}>
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {backButtonText}
                </Button>
              </Link>
            )}
            <ThemeToggle />
          </div>

          <div className="max-w-4xl mx-auto">
            {fallbackContent ? (
              fallbackContent
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Contenido no encontrado
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    {error || 'La página que buscas no está disponible.'}
                  </p>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center items-center gap-2 mb-4">
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No disponible'}
                </Badge>
              </div>

              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {page.title}
              </CardTitle>

              {page.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {page.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="prose prose-lg max-w-none dark:prose-invert text-foreground [&_*]:text-foreground">
              <ContentRenderer page={page} showTitle={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicContentPage;