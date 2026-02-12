'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogTitle } from './dialog';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    alt?: string;
}

export const ImageModal = ({
    isOpen,
    onClose,
    images,
    currentIndex,
    onIndexChange,
    alt = 'Imagen'
}: ImageModalProps) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset states when modal opens or image changes
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, currentIndex]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        onIndexChange(currentIndex - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (images && currentIndex < images.length - 1) {
                        onIndexChange(currentIndex + 1);
                    }
                    break;
                case '+':
                case '=':
                    setZoom(prev => Math.min(prev + 0.25, 3));
                    break;
                case '-':
                    setZoom(prev => Math.max(prev - 0.25, 0.5));
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, images?.length, onClose, onIndexChange]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (images && currentIndex < images.length - 1) {
            onIndexChange(currentIndex + 1);
        }
    };

    if (!images || !images.length) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden">
                <VisuallyHidden>
                    <DialogTitle>Visor de imágenes - {alt} {currentIndex + 1} de {images?.length || 0}</DialogTitle>
                </VisuallyHidden>
                <div className="relative w-full h-[95vh] flex items-center justify-center overflow-hidden">
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10 rounded-full"
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    {/* Controls */}
                    <div className="absolute top-4 left-4 z-50 flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            className="bg-black/50 hover:bg-black/70 text-white border-none"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            className="bg-black/50 hover:bg-black/70 text-white border-none"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRotate}
                            className="bg-black/50 hover:bg-black/70 text-white border-none"
                        >
                            <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="bg-black/50 hover:bg-black/70 text-white border-none px-3"
                        >
                            Reset
                        </Button>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentIndex + 1} / {images?.length || 0}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images && images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-none h-12 w-12"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                disabled={!images || currentIndex === images.length - 1}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-none h-12 w-12"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </>
                    )}

                    {/* Main Image */}
                    <div
                        className="relative cursor-move select-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                    >
                        <Image
                            src={images[currentIndex]}
                            alt={`${alt} ${currentIndex + 1}`}
                            width={1200}
                            height={800}
                            className="max-w-[90vw] max-h-[90vh] object-contain"
                            priority
                            draggable={false}
                        />
                    </div>

                    {/* Thumbnails */}
                    {images && images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                            <div className="flex gap-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onIndexChange(index)}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden transition-all ${index === currentIndex
                                            ? 'ring-2 ring-white'
                                            : 'opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <Image
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};