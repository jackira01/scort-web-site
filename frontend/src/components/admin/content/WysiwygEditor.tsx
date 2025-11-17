'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WysiwygEditor = ({
  value,
  onChange,
  placeholder = "Escribe tu contenido aquí...",
  className
}: WysiwygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atajos de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            executeCommand('redo');
          } else {
            executeCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Ingresa la URL del enlace:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      command: 'bold',
      title: 'Negrita (Ctrl+B)',
      action: () => executeCommand('bold')
    },
    {
      icon: Italic,
      command: 'italic',
      title: 'Cursiva (Ctrl+I)',
      action: () => executeCommand('italic')
    },
    {
      icon: Underline,
      command: 'underline',
      title: 'Subrayado (Ctrl+U)',
      action: () => executeCommand('underline')
    },
    {
      icon: List,
      command: 'insertUnorderedList',
      title: 'Lista con viñetas',
      action: () => executeCommand('insertUnorderedList')
    },
    {
      icon: ListOrdered,
      command: 'insertOrderedList',
      title: 'Lista numerada',
      action: () => executeCommand('insertOrderedList')
    },
    {
      icon: Link,
      command: 'createLink',
      title: 'Insertar enlace',
      action: insertLink
    },
    {
      icon: Quote,
      command: 'formatBlock',
      title: 'Cita',
      action: () => formatBlock('blockquote')
    },
    {
      icon: Code,
      command: 'formatBlock',
      title: 'Código',
      action: () => formatBlock('pre')
    },
    {
      icon: Undo,
      command: 'undo',
      title: 'Deshacer (Ctrl+Z)',
      action: () => executeCommand('undo')
    },
    {
      icon: Redo,
      command: 'redo',
      title: 'Rehacer (Ctrl+Shift+Z)',
      action: () => executeCommand('redo')
    }
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                title={button.title}
                className="h-8 w-8 p-0"
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsEditorFocused(true)}
          onBlur={() => setIsEditorFocused(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[200px] p-4 outline-none prose prose-sm max-w-none",
            "focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "[&]:text-foreground [&_*]:text-foreground",
            !value && "text-muted-foreground",
            className
          )}
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />

        {/* Placeholder */}
        {!value && !isEditorFocused && (
          <div
            className="absolute top-[60px] left-4 text-muted-foreground pointer-events-none select-none"
            style={{ zIndex: 1 }}
          >
            {placeholder}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WysiwygEditor;