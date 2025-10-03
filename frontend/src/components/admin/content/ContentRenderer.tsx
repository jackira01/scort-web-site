'use client';

import { IContentPage, IContentSection, IContentBlock, ContentBlockType } from '@/types/content.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ContentRendererProps {
  page: IContentPage;
  className?: string;
  showTitle?: boolean;
  showSectionTitles?: boolean;
}

const ContentRenderer = ({ 
  page, 
  className,
  showTitle = true,
  showSectionTitles = true 
}: ContentRendererProps) => {
  const renderBlock = (block: IContentBlock) => {
    switch (block.type) {
      case ContentBlockType.PARAGRAPH:
        return (
          <div 
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ 
              __html: typeof block.value === 'string' ? block.value : '' 
            }}
          />
        );

      case ContentBlockType.LIST:
        const listItems = Array.isArray(block.value) ? block.value : [];
        return (
          <div className="space-y-2">
            {listItems.map((item, index) => (
              <details key={index} className="group border border-border rounded-lg">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground">{item}</span>
                  <svg 
                    className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {/* Aquí se puede agregar contenido adicional si es necesario */}
                  Información adicional sobre: {item}
                </div>
              </details>
            ))}
          </div>
        );

      case ContentBlockType.IMAGE:
        const imageUrl = typeof block.value === 'string' ? block.value : '';
        return imageUrl ? (
          <div className="my-4">
            <img 
              src={imageUrl} 
              alt="Contenido" 
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        ) : null;

      case ContentBlockType.LINK:
        const linkUrl = typeof block.value === 'string' ? block.value : '';
        return linkUrl ? (
          <a 
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline transition-colors"
          >
            {linkUrl}
          </a>
        ) : null;

      default:
        return null;
    }
  };

  const renderSection = (section: IContentSection, index: number) => (
    <div key={index} className="space-y-4">
      {showSectionTitles && section.title && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {section.title}
          </h2>
          <Separator />
        </div>
      )}
      
      <div className="space-y-4">
        {section.blocks
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((block, blockIndex) => (
            <div key={blockIndex} className="space-y-2">
              {renderBlock(block)}
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {showTitle && page.title && (
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {page.title}
          </h1>
          <Separator />
        </div>
      )}
      
      <div className="space-y-8">
        {page.sections
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((section, index) => renderSection(section, index))}
      </div>
    </div>
  );
};

export default ContentRenderer;