'use client';

import { IContentPage, IContentSection, IContentBlock, ContentBlockType, IFaqItem } from '@/types/content.types';
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
        const listItems = Array.isArray(block.value) && block.value.length > 0 && typeof block.value[0] === 'string'
          ? block.value as string[]
          : [];
        return (
          <ul className="list-disc list-inside space-y-2 text-foreground">
            {listItems.map((item, index) => (
              <li key={index} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
        );

      case ContentBlockType.FAQ:
        const faqItems = Array.isArray(block.value) && block.value.length > 0 && typeof block.value[0] === 'object'
          ? block.value as IFaqItem[]
          : [];
        return (
          <div className="space-y-3">
            {faqItems.map((faqItem, index) => (
              <details key={index} className="group border border-border rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground pr-4">{faqItem.question}</span>
                  <svg
                    className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-2 text-sm text-muted-foreground border-t border-border bg-muted/20">
                  <p className="whitespace-pre-wrap">{faqItem.answer}</p>
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