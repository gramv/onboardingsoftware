import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import CameraInterface from './CameraInterface';
import DocumentPreview from './DocumentPreview';
import OCRProcessing from './OCRProcessing';
import DocumentOrganizer from './DocumentOrganizer';
import { onboardingService } from '../../../services/onboardingService';

export interface DocumentFile {
  id: string;
  file: File;
  type: DocumentType;
  preview: string;
  ocrData?: OCRData;
  quality: DocumentQuality;
  timestamp: Date;
}

export interface OCRData {
  extractedFields: Record<string, any>;
  confidenceScores: Record<string, number>;
  rawText: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  requiresReview: boolean;
}

export interface DocumentQuality {
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export type DocumentType = 
  | 'drivers_license' 
  | 'ssn_card' 
  | 'passport' 
  | 'birth_certificate'
  | 'other';

interface DocumentCaptureProps {
  onDocumentsChange: (documents: DocumentFile[]) => void;
  onContinue?: () => void;
  onBack?: () => void;
  language: 'en' | 'es';
  highContrast?: boolean;
  largeText?: boolean;
  maxDocuments?: number;
  allowedTypes?: DocumentType[];
  className?: string;
}

const DocumentCapture: React.FC<DocumentCaptureProps> = ({
  onDocumentsChange,
  onContinue,
  onBack,
  language,
  highContrast = false,
  largeText = false,
  maxDocuments = 10,
  allowedTypes = ['drivers_license', 'ssn_card', 'passport', 'birth_certificate', 'other'],
  className = ''
}) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [currentView, setCurrentView] = useState<'capture' | 'preview' | 'ocr' | 'organize'>('capture');
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const texts = {
    en: {
      title: 'Document Capture',
      subtitle: 'Upload or capture your required documents',
      dragDropText: 'Drag and drop files here, or click to select',
      cameraCapture: 'Use Camera',
      fileUpload: 'Upload Files',
      supportedFormats: 'Supported: JPG, PNG, PDF (max 10MB each)',
      processing: 'Processing documents...',
      documentsUploaded: 'documents uploaded',
      viewAll: 'View All Documents',
      retake: 'Retake Photo',
      enhance: 'Enhance Quality',
      continue: 'Continue',
      back: 'Back'
    },
    es: {
      title: 'Captura de Documentos',
      subtitle: 'Suba o capture sus documentos requeridos',
      dragDropText: 'Arrastre y suelte archivos aquí, o haga clic para seleccionar',
      cameraCapture: 'Usar Cámara',
      fileUpload: 'Subir Archivos',
      supportedFormats: 'Soportado: JPG, PNG, PDF (máx. 10MB cada uno)',
      processing: 'Procesando documentos...',
      documentsUploaded: 'documentos subidos',
      viewAll: 'Ver Todos los Documentos',
      retake: 'Tomar Foto Nuevamente',
      enhance: 'Mejorar Calidad',
      continue: 'Continuar',
      back: 'Atrás'
    }
  };

  const t = texts[language];

  // Update parent when documents change
  useEffect(() => {
    onDocumentsChange(documents);
  }, [documents, onDocumentsChange]);

  const generateDocumentId = () => {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const assessDocumentQuality = (file: File): Promise<DocumentQuality> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = Math.min(img.width, 1200); // Limit processing size for performance
        canvas.height = Math.min(img.height, 900);
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Enhanced quality assessment
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 100;
        
        // Check image dimensions
        if (img.width < 1000 || img.height < 700) {
          issues.push(language === 'es' ? 'Resolución baja' : 'Low resolution');
          recommendations.push(language === 'es' ? 'Use una resolución más alta (mín. 1000x700)' : 'Use higher resolution (min 1000x700)');
          score -= 15;
        }
        
        // Check file size
        if (file.size < 200000) { // Less than 200KB
          issues.push(language === 'es' ? 'Archivo muy pequeño' : 'File too small');
          recommendations.push(language === 'es' ? 'Capture con mejor calidad (mín. 200KB)' : 'Capture with better quality (min 200KB)');
          score -= 10;
        } else if (file.size > 5 * 1024 * 1024) { // More than 5MB
          issues.push(language === 'es' ? 'Archivo muy grande' : 'File too large');
          recommendations.push(language === 'es' ? 'Reduzca el tamaño del archivo' : 'Reduce file size');
          score -= 5;
        }
        
        // Enhanced image analysis
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let brightness = 0;
          let contrast = 0;
          let totalPixels = data.length / 4;
          
          // Calculate brightness and basic contrast
          let minBrightness = 255;
          let maxBrightness = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const pixelBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            brightness += pixelBrightness;
            minBrightness = Math.min(minBrightness, pixelBrightness);
            maxBrightness = Math.max(maxBrightness, pixelBrightness);
          }
          
          brightness = brightness / totalPixels;
          contrast = maxBrightness - minBrightness;
          
          // Brightness assessment
          if (brightness < 40) {
            issues.push(language === 'es' ? 'Imagen muy oscura' : 'Image too dark');
            recommendations.push(language === 'es' ? 'Mejore la iluminación ambiente' : 'Improve ambient lighting');
            score -= 20;
          } else if (brightness > 220) {
            issues.push(language === 'es' ? 'Imagen muy brillante' : 'Image too bright');
            recommendations.push(language === 'es' ? 'Reduzca la luz directa' : 'Reduce direct light');
            score -= 15;
          }
          
          // Contrast assessment
          if (contrast < 50) {
            issues.push(language === 'es' ? 'Bajo contraste' : 'Low contrast');
            recommendations.push(language === 'es' ? 'Aumente el contraste de la imagen' : 'Increase image contrast');
            score -= 15;
          }
          
          // Sharpness assessment (edge detection)
          let edgeScore = 0;
          const edgeThreshold = 30;
          const samples = Math.min(10000, totalPixels / 10); // Sample pixels for performance
          
          for (let s = 0; s < samples; s++) {
            const i = Math.floor(Math.random() * (totalPixels - canvas.width - 1)) * 4;
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            
            if (x < canvas.width - 1 && y < canvas.height - 1) {
              const idx = i;
              const idxRight = idx + 4;
              const idxDown = idx + canvas.width * 4;
              
              const diffX = Math.abs(data[idx] - data[idxRight]) + 
                           Math.abs(data[idx + 1] - data[idxRight + 1]) + 
                           Math.abs(data[idx + 2] - data[idxRight + 2]);
              
              const diffY = Math.abs(data[idx] - data[idxDown]) + 
                           Math.abs(data[idx + 1] - data[idxDown + 1]) + 
                           Math.abs(data[idx + 2] - data[idxDown + 2]);
              
              if (diffX > edgeThreshold || diffY > edgeThreshold) {
                edgeScore++;
              }
            }
          }
          
          const sharpnessRatio = edgeScore / samples;
          if (sharpnessRatio < 0.05) {
            issues.push(language === 'es' ? 'Imagen borrosa' : 'Image blurry');
            recommendations.push(language === 'es' ? 'Mantenga la cámara estable' : 'Keep camera steady');
            score -= 20;
          }
        }
        
        resolve({
          score: Math.max(0, Math.min(100, score)),
          issues,
          recommendations
        });
      };
      
      img.onerror = () => {
        resolve({
          score: 0,
          issues: [language === 'es' ? 'No se pudo cargar la imagen' : 'Could not load image'],
          recommendations: [language === 'es' ? 'Intente con otro archivo o formato' : 'Try another file or format']
        });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const detectDocumentType = (file: File): DocumentType => {
    const fileName = file.name.toLowerCase();
    
    // Enhanced detection with more keywords and patterns
    if (fileName.includes('license') || fileName.includes('dl') || fileName.includes('licencia') || 
        fileName.includes('driving') || fileName.includes('driver') || fileName.includes('permiso')) {
      return 'drivers_license';
    } else if (fileName.includes('ssn') || fileName.includes('social') || fileName.includes('seguro') || 
               fileName.includes('security') || fileName.includes('seguridad')) {
      return 'ssn_card';
    } else if (fileName.includes('passport') || fileName.includes('pasaporte') || 
               fileName.includes('passeport') || fileName.includes('travel')) {
      return 'passport';
    } else if (fileName.includes('birth') || fileName.includes('nacimiento') || 
               fileName.includes('certificate') || fileName.includes('certificado') || 
               fileName.includes('acta')) {
      return 'birth_certificate';
    }
    
    return 'other';
  };

  const processFile = async (file: File): Promise<DocumentFile> => {
    const preview = URL.createObjectURL(file);
    const quality = await assessDocumentQuality(file);
    const detectedType = detectDocumentType(file);
    const documentId = generateDocumentId();
    
    // Get onboarding session from storage
    const sessionData = sessionStorage.getItem('onboardingSession');
    const session = sessionData ? JSON.parse(sessionData) : null;
    
    let ocrData: OCRData | undefined;
    
    if (session) {
      try {
        // Upload document to backend and get OCR processing
        const uploadResult = await onboardingService.uploadDocument(
          session.id,
          file,
          detectedType
        );
        
        if (uploadResult.success && uploadResult.ocrResult) {
          // Enhanced OCR data processing with better field mapping
          const extractedFields = mapOCRFields(uploadResult.ocrResult.extractedData || {});
          const confidenceScores = uploadResult.ocrResult.fieldConfidences || {};
          
          // Calculate average confidence for document
          const avgConfidence = Object.values(confidenceScores).length > 0 
            ? Object.values(confidenceScores).reduce((sum, score) => sum + score, 0) / Object.values(confidenceScores).length
            : 0;
          
          ocrData = {
            extractedFields,
            confidenceScores,
            rawText: uploadResult.ocrResult.rawText || '',
            processingStatus: uploadResult.ocrResult.processingStatus || 'completed',
            requiresReview: avgConfidence < 75 || quality.score < 70 // Lower threshold for quality
          };
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        // Continue with local processing if upload fails
        ocrData = {
          extractedFields: {},
          confidenceScores: {},
          rawText: '',
          processingStatus: 'failed',
          requiresReview: true
        };
      }
    }
    
    return {
      id: documentId,
      file,
      type: detectedType,
      preview,
      quality,
      ocrData,
      timestamp: new Date()
    };
  };

  // Map OCR fields to standardized format for form auto-fill
  const mapOCRFields = (rawFields: Record<string, any>): Record<string, any> => {
    const mappedFields: Record<string, any> = {};
    
    // Map common OCR field names to standardized keys
    const fieldMappings = {
      // Personal information
      'firstName': ['first_name', 'firstName', 'given_name', 'nombre', 'fname'],
      'lastName': ['last_name', 'lastName', 'surname', 'family_name', 'apellido', 'lname'],
      'fullName': ['full_name', 'name', 'complete_name', 'nombre_completo'],
      'dateOfBirth': ['dob', 'date_of_birth', 'birth_date', 'fecha_nacimiento', 'birthday'],
      
      // Address
      'address': ['address', 'street_address', 'direccion', 'street'],
      'city': ['city', 'ciudad', 'town'],
      'state': ['state', 'province', 'estado', 'region'],
      'zipCode': ['zip_code', 'postal_code', 'zip', 'codigo_postal'],
      
      // Document specific
      'licenseNumber': ['license_number', 'dl_number', 'drivers_license', 'licencia'],
      'ssn': ['ssn', 'social_security', 'social_security_number', 'seguro_social'],
      'passportNumber': ['passport_number', 'passport', 'pasaporte'],
      'issuingAuthority': ['issuing_authority', 'authority', 'emisor'],
      'expiryDate': ['expiry_date', 'expiration_date', 'expires', 'expiracion'],
      
      // Contact
      'phone': ['phone', 'telephone', 'phone_number', 'telefono'],
      'email': ['email', 'email_address', 'correo']
    };
    
    // Map fields using the mappings
    Object.entries(rawFields).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      
      Object.entries(fieldMappings).forEach(([standardKey, variants]) => {
        if (variants.some(variant => lowerKey.includes(variant.toLowerCase()))) {
          mappedFields[standardKey] = value;
        }
      });
      
      // Also keep original key as fallback
      if (!mappedFields[key]) {
        mappedFields[key] = value;
      }
    });
    
    return mappedFields;
  };

  const handleFileSelect = async (files: FileList | File[]) => {
    setIsProcessing(true);
    
    try {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        return isValidType && isValidSize;
      });
      
      if (validFiles.length + documents.length > maxDocuments) {
        showNotification(language === 'es' 
          ? `Solo puede subir un máximo de ${maxDocuments} documentos`
          : `You can only upload a maximum of ${maxDocuments} documents`,
          'error'
        );
        setIsProcessing(false);
        return;
      }
      
      // Process files with progress tracking
      const processedFiles: DocumentFile[] = [];
      for (let i = 0; i < validFiles.length; i++) {
        showNotification(
          language === 'es' 
            ? `Procesando ${i + 1} de ${validFiles.length} documentos...`
            : `Processing ${i + 1} of ${validFiles.length} documents...`,
          'info'
        );
        
        const processed = await processFile(validFiles[i]);
        processedFiles.push(processed);
      }
      
      setDocuments(prev => [...prev, ...processedFiles]);
      
      // Show summary notification
      const successfulOCR = processedFiles.filter(doc => doc.ocrData && !doc.ocrData.requiresReview).length;
      const needsReview = processedFiles.filter(doc => doc.ocrData && doc.ocrData.requiresReview).length;
      
      if (successfulOCR > 0) {
        showNotification(
          language === 'es' 
            ? `${successfulOCR} documentos procesados correctamente`
            : `${successfulOCR} documents processed successfully`,
          'success'
        );
      }
      
      if (needsReview > 0) {
        showNotification(
          language === 'es' 
            ? `${needsReview} documentos necesitan revisión manual`
            : `${needsReview} documents need manual review`,
          'warning'
        );
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      showNotification(
        language === 'es' 
          ? 'Error al procesar los archivos. Por favor, inténtelo de nuevo.'
          : 'Error processing files. Please try again.',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      ${type === 'success' ? 'bg-green-500 text-white' : ''}
      ${type === 'error' ? 'bg-red-500 text-white' : ''}
      ${type === 'warning' ? 'bg-yellow-500 text-black' : ''}
      ${type === 'info' ? 'bg-blue-500 text-white' : ''}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect([file]);
  };

  const handleDocumentSelect = (document: DocumentFile) => {
    setSelectedDocument(document);
    setCurrentView('preview');
  };

  const handleOCRProcess = (document: DocumentFile) => {
    setSelectedDocument(document);
    setCurrentView('ocr');
  };

  const handleOCRComplete = (ocrData: OCRData) => {
    if (selectedDocument) {
      const updatedDocument = { ...selectedDocument, ocrData };
      setDocuments(prev => 
        prev.map(doc => doc.id === selectedDocument.id ? updatedDocument : doc)
      );
      setSelectedDocument(updatedDocument);
    }
  };

  const handleDocumentUpdate = (updatedDocument: DocumentFile) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    );
    setSelectedDocument(updatedDocument);
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
      setCurrentView('capture');
    }
  };

  const renderCaptureView = () => (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? (highContrast ? 'border-yellow-400 bg-yellow-100' : 'border-primary-500 bg-primary-50')
            : (highContrast ? 'border-gray-400 bg-gray-800' : 'border-gray-300 bg-gray-50')
          }
          ${highContrast ? 'text-white' : 'text-gray-600'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className={`font-medium ${largeText ? 'text-xl' : 'text-lg'}`}>
              {t.dragDropText}
            </p>
            <p className={`mt-2 ${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
              {t.supportedFormats}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CameraInterface
          onCapture={handleCameraCapture}
          language={language}
          highContrast={highContrast}
          largeText={largeText}
        />
        
        <Button
          variant="outline"
          size={largeText ? 'lg' : 'md'}
          onClick={() => fileInputRef.current?.click()}
          className="h-20 flex flex-col items-center justify-center space-y-2"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className={largeText ? 'text-lg' : 'text-base'}>{t.fileUpload}</span>
        </Button>
      </div>

      {/* Document Grid */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-xl' : 'text-lg'}`}>
              {documents.length} {t.documentsUploaded}
            </h3>
            <Button
              variant="outline"
              size={largeText ? 'md' : 'sm'}
              onClick={() => setCurrentView('organize')}
            >
              {t.viewAll}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.slice(0, 8).map((document) => (
              <Card
                key={document.id}
                className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                  highContrast ? 'bg-gray-800 border-gray-600' : ''
                }`}
                onClick={() => handleDocumentSelect(document)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                  <img
                    src={document.preview}
                    alt="Document preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium truncate ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                    {document.file.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      document.quality.score >= 80 ? 'bg-green-500' :
                      document.quality.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className={`text-xs ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
                      {document.quality.score}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className={`${highContrast ? 'text-white' : 'text-gray-600'} ${largeText ? 'text-lg' : 'text-base'}`}>
            {t.processing}
          </p>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'capture':
        return renderCaptureView();
      
      case 'preview':
        return selectedDocument ? (
          <DocumentPreview
            document={selectedDocument}
            onUpdate={handleDocumentUpdate}
            onOCRProcess={() => handleOCRProcess(selectedDocument)}
            onDelete={() => handleDeleteDocument(selectedDocument.id)}
            onBack={() => setCurrentView('capture')}
            language={language}
            highContrast={highContrast}
            largeText={largeText}
          />
        ) : null;
      
      case 'ocr':
        return selectedDocument ? (
          <OCRProcessing
            document={selectedDocument}
            onComplete={handleOCRComplete}
            onBack={() => setCurrentView('preview')}
            language={language}
            highContrast={highContrast}
            largeText={largeText}
          />
        ) : null;
      
      case 'organize':
        return (
          <DocumentOrganizer
            documents={documents}
            onDocumentsChange={setDocuments}
            onDocumentSelect={handleDocumentSelect}
            onBack={() => setCurrentView('capture')}
            language={language}
            highContrast={highContrast}
            largeText={largeText}
          />
        );
      
      default:
        return renderCaptureView();
    }
  };

  return (
    <div className={`${className} ${highContrast ? 'bg-black text-white' : 'bg-white'}`}>
      <div className="mb-6">
        <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} mb-2 ${largeText ? 'text-3xl' : 'text-2xl'}`}>
          {t.title}
        </h2>
        <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-lg' : 'text-base'}`}>
          {t.subtitle}
        </p>
      </div>

      {renderCurrentView()}

      {/* Navigation Controls - Only show on main capture view */}
      {currentView === 'capture' && (onContinue || onBack) && (
        <div className="mt-8 flex justify-between">
          {onBack && (
            <Button
              variant="outline"
              size={largeText ? 'lg' : 'md'}
              onClick={onBack}
            >
              {t.back}
            </Button>
          )}
          
          {onContinue && (
            <Button
              variant="primary"
              size={largeText ? 'lg' : 'md'}
              onClick={onContinue}
              disabled={documents.length === 0}
              className="ml-auto"
            >
              {t.continue}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentCapture;