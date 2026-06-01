"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  alt?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex?: number;
  onClose?: () => void;
  showThumbnails?: boolean;
}

export default function GalleryLightbox({
  images,
  initialIndex = 0,
  onClose,
  showThumbnails = true,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isOpen, setIsOpen] = useState(false);

  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "Escape") handleClose();
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, currentIndex]);

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setCurrentIndex(index);
              setIsOpen(true);
            }}
            className="cursor-pointer relative overflow-hidden rounded-lg group"
          >
            <img
              src={image.url}
              alt={image.alt || image.title || "Gallery image"}
              className="w-full h-40 object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <i className="fas fa-search-plus text-white text-2xl"></i>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center"
            onClick={handleClose}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 text-2xl"
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Main Image Container */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex-1 flex items-center justify-center px-4 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage.url}
                alt={currentImage.alt || currentImage.title || "Gallery image"}
                className="max-h-[80vh] max-w-[90vw] object-contain"
              />
            </motion.div>

            {/* Image Info */}
            {(currentImage.title || currentImage.description) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-white mb-4 px-4 max-w-2xl"
              >
                {currentImage.title && (
                  <h3 className="text-xl font-semibold">{currentImage.title}</h3>
                )}
                {currentImage.description && (
                  <p className="text-gray-300 text-sm mt-2">
                    {currentImage.description}
                  </p>
                )}
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-6 mt-4 px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="text-white hover:text-gray-300 text-2xl transition"
                aria-label="Previous"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <span className="text-white text-sm font-mono">
                {currentIndex + 1} / {images.length}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="text-white hover:text-gray-300 text-2xl transition"
                aria-label="Next"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Thumbnails Strip */}
            {showThumbnails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 mt-6 pb-4 overflow-x-auto max-w-4xl px-4"
              >
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`flex-shrink-0 transition ${
                      index === currentIndex
                        ? "ring-2 ring-amber-400"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-16 w-16 object-cover rounded"
                    />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Keyboard Hint */}
            <div className="text-gray-400 text-xs mt-4">
              <i className="fas fa-keyboard mr-1"></i>
              Use arrow keys to navigate, ESC to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
