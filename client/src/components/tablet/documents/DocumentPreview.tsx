import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { DocumentFile } from './DocumentCapture';

interface DocumentPreviewProps {
  document: DocumentFile;
  onUpdate: (document: DocumentFile) => void;
  onOCRProcess: () => void;
  onDelete: () => void;
  onBack: () => void;
  language: 'en' | 'es';
  highContrast?: boolean;
  largeText?: boolean;
  className?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onUpdate,
  onOCRProcess,
  onDelete,
  onBack,
  language,
  highContrast = false,
  largeText = false,
  className = ''
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showEnhanceOptions, setShowEnhanceOptions] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const texts = {
    en: {
      preview: 'Document Preview',
      quality: 'Quality Score',
      issues: 'Issues Detected',
      recommendations: 'Recommendations',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      rotateLeft: 'Rotate Left',
      rotateRight: 'Rotate Right',
      enhance: 'Enhance Quality',
      processOCR: 'Process with OCR',
      delete: 'Delete Document',
      back: 'Back',
      enhancing: 'Enhancing...',
      brightness: 'Brightness',
      contrast: 'Contrast',
      sharpness: 'Sharpness',
      applyEnhancements: 'Apply Enhancements',
      resetEnhancements: 'Reset',
      documentType: 'Document Type',
      fileSize: 'File Size',
      dimensions: 'Dimensions',
      timestamp: 'Captured',
      noIssues: 'No issues detected',
      goodQuality: 'Good quality document'
    },
    es: {
      preview: 'Vista Previa del Documento',
      quality: 'Puntuación de Calidad',
      issues: 'Problemas Detectados',
      recommendations: 'Recomendaciones',
      zoomIn: 'Acercar',
      zoomOut: 'Alejar',
      rotateLeft: 'Rotar Izquierda',
      rotateRight: 'Rotar Derecha',
      enhance: 'Mejorar Calidad',
      processOCR: 'Procesar con OCR',
      delete: 'Eliminar Documento',
      back: 'Atrás',
      enhancing: 'Mejorando...',
      brightness: 'Brillo',
      contrast: 'Contraste',
      sharpness: 'Nitidez',
      applyEnhancements: 'Aplicar Mejoras',
      resetEnhancements: 'Restablecer',
      documentType: 'Tipo de Documento',
      fileSize: 'Tamaño de Archivo',
      dimensions: 'Dimensiones',
      timestamp: 'Capturado',
      noIssues: 'No se detectaron problemas',
      goodQuality: 'Documento de buena calidad'
    }
  };

  const t = texts[language];

  const documentTypeLabels = {
    en: {
      drivers_license: 'Driver\'s License',
      ssn_card: 'Social Security Card',
      passport: 'Passport',
      birth_certificate: 'Birth Certificate',
      other: 'Other Document'
    },
    es: {
      drivers_license: 'Licencia de Conducir',
      ssn_card: 'Tarjeta de Seguro Social',
      passport: 'Pasaporte',
      birth_certificate: 'Certificado de Nacimiento',
      other: 'Otro Documento'
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const applyImageEnhancements = useCallback(async (
    brightness: number = 0,
    contrast: number = 0,
    sharpness: number = 0
  ) => {
    if (!canvasRef.current || !imageRef.current) return null;

    setIsEnhancing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) {
      setIsEnhancing(false);
      return null;
    }

    // Set canvas size to image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness and contrast
    const brightnessFactor = brightness / 100;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] += brightnessFactor * 255;     // Red
      data[i + 1] += brightnessFactor * 255; // Green
      data[i + 2] += brightnessFactor * 255; // Blue

      // Apply contrast
      data[i] = contrastFactor * (data[i] - 128) + 128;     // Red
      data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128; // Green
      data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128; // Blue

      // Clamp values
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }

    // Apply sharpness (simple unsharp mask)
    if (sharpness > 0) {
      const sharpnessMatrix = [
        0, -1, 0,
        -1, 5 + sharpness / 20, -1,
        0, -1, 0
      ];
      
      // Apply convolution (simplified)
      const originalData = new Uint8ClampedArray(data);
      const width = canvas.width;
      
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                sum += originalData[idx] * sharpnessMatrix[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * width + x) * 4 + c;
            data[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }
    }

    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to blob
    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const enhancedFile = new File([blob], document.file.name, {
            type: document.file.type
          });
          resolve(enhancedFile);
        } else {
          resolve(null);
        }
        setIsEnhancing(false);
      }, document.file.type, 0.9);
    });
  }, [document.file]);

  const handleEnhanceDocument = async () => {
    const enhancedFile = await applyImageEnhancements(10, 15, 5); // Default enhancements
    
    if (enhancedFile) {
      const enhancedDocument: DocumentFile = {
        ...document,
        file: enhancedFile,
        preview: URL.createObjectURL(enhancedFile),
        quality: {
          ...document.quality,
          score: Math.min(100, document.quality.score + 10)
        }
      };
      
      onUpdate(enhancedDocument);
    }
  };

  const handleDeleteConfirm = () => {
    if (window.confirm(
      language === 'es' 
        ? '¿Está seguro de que desea eliminar este documento?'
        : 'Are you sure you want to delete this document?'
    )) {
      onDelete();
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} mb-1 ${largeText ? 'text-2xl' : 'text-xl'}`}>
            {t.preview}
          </h2>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {document.file.name}
          </p>
        </div>
        <Button
          variant="outline"
          size={largeText ? 'md' : 'sm'}
          onClick={onBack}
        >
          {t.back}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Preview */}
        <div className="lg:col-span-2">
          <Card className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
            <div className="relative overflow-hidden rounded-lg bg-gray-100 min-h-96">
              <img
                ref={imageRef}
                src={document.preview}
                alt="Document preview"
                className="w-full h-full object-contain transition-transform duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
              
              {/* Zoom Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                  disabled={zoom >= 3}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                  disabled={zoom <= 0.25}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </Button>
              </div>

              {/* Rotation Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotateLeft}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotateRight}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Image Controls */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size={largeText ? 'md' : 'sm'}
                onClick={handleEnhanceDocument}
                disabled={isEnhancing}
              >
                {isEnhancing ? t.enhancing : t.enhance}
              </Button>
              <Button
                variant="primary"
                size={largeText ? 'md' : 'sm'}
                onClick={onOCRProcess}
              >
                {t.processOCR}
              </Button>
              <Button
                variant="outline"
                size={largeText ? 'md' : 'sm'}
                onClick={handleDeleteConfirm}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {t.delete}
              </Button>
            </div>
          </Card>
        </div>

        {/* Document Information */}
        <div className="space-y-4">
          {/* Quality Assessment */}
          <Card className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
            <h3 className={`font-semibold mb-3 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
              {t.quality}
            </h3>
            
            <div className={`p-3 rounded-lg border ${getQualityBgColor(document.quality.score)} ${highContrast ? 'bg-gray-700 border-gray-600' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${getQualityColor(document.quality.score)} ${largeText ? 'text-lg' : 'text-base'}`}>
                  {document.quality.score}%
                </span>
                <div className={`w-3 h-3 rounded-full ${
                  document.quality.score >= 80 ? 'bg-green-500' :
                  document.quality.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              
              {document.quality.issues.length > 0 ? (
                <div className="space-y-2">
                  <h4 className={`font-medium ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-base' : 'text-sm'}`}>
                    {t.issues}:
                  </h4>
                  <ul className={`space-y-1 ${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                    {document.quality.issues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {document.quality.recommendations.length > 0 && (
                    <>
                      <h4 className={`font-medium mt-3 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-base' : 'text-sm'}`}>
                        {t.recommendations}:
                      </h4>
                      <ul className={`space-y-1 ${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                        {document.quality.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <p className={`${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t.goodQuality}
                </p>
              )}
            </div>
          </Card>

          {/* Document Details */}
          <Card className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
            <h3 className={`font-semibold mb-3 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
              Document Details
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className={`${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                  {t.documentType}
                </span>
                <p className={`${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-white' : 'text-gray-900'} font-medium`}>
                  {documentTypeLabels[language][document.type]}
                </p>
              </div>
              
              <div>
                <span className={`${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                  {t.fileSize}
                </span>
                <p className={`${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-white' : 'text-gray-900'} font-medium`}>
                  {formatFileSize(document.file.size)}
                </p>
              </div>
              
              <div>
                <span className={`${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                  {t.timestamp}
                </span>
                <p className={`${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-white' : 'text-gray-900'} font-medium`}>
                  {formatTimestamp(document.timestamp)}
                </p>
              </div>
            </div>
          </Card>

          {/* OCR Status */}
          {document.ocrData && (
            <Card className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
              <h3 className={`font-semibold mb-3 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
                OCR Status
              </h3>
              
              <div className={`p-3 rounded-lg ${
                document.ocrData.processingStatus === 'completed' ? 'bg-green-50 border border-green-200' :
                document.ocrData.processingStatus === 'failed' ? 'bg-red-50 border border-red-200' :
                'bg-yellow-50 border border-yellow-200'
              } ${highContrast ? 'bg-gray-700 border-gray-600' : ''}`}>
                <p className={`${largeText ? 'text-base' : 'text-sm'} ${
                  document.ocrData.processingStatus === 'completed' ? 'text-green-800' :
                  document.ocrData.processingStatus === 'failed' ? 'text-red-800' :
                  'text-yellow-800'
                } ${highContrast ? 'text-white' : ''}`}>
                  Status: {document.ocrData.processingStatus}
                </p>
                
                {document.ocrData.requiresReview && (
                  <p className={`mt-1 ${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                    Manual review required
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DocumentPreview;