import React, { useState, useRef } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../../hooks/useToast';
import { onboardingService } from '../../../services/onboardingService';

interface DocumentUploadStepProps {
  sessionId: string;
  language: 'en' | 'es';
  onDocumentsUploaded: (documents: any[], ocrData: any) => void;
  onBack: () => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: 'drivers_license' | 'ssn_card' | 'passport' | 'other';
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  ocrData?: any;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  sessionId,
  language,
  onDocumentsUploaded,
  onBack
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const t = {
    en: {
      title: 'Upload Your Documents',
      subtitle: 'Please upload your identification documents for verification',
      driversLicense: 'Driver\'s License or State ID',
      ssnCard: 'Social Security Card',
      required: 'Required',
      optional: 'Optional',
      dragDrop: 'Drag and drop files here, or',
      browse: 'browse to select',
      supportedFormats: 'Supported formats: JPG, PNG, PDF (max 10MB each)',
      uploadAnother: 'Upload Another Document',
      processing: 'Processing...',
      completed: 'Completed',
      error: 'Error',
      retry: 'Retry',
      remove: 'Remove',
      continue: 'Continue',
      back: 'Back',
      ocrProcessing: 'Extracting information...',
      ocrCompleted: 'Information extracted successfully',
      ocrError: 'Could not extract information. Please check document quality.',
      documentTips: 'Document Tips',
      tip1: 'Ensure document is well-lit and in focus',
      tip2: 'Capture the entire document',
      tip3: 'Avoid glare and shadows',
      tip4: 'Use a dark background for contrast'
    },
    es: {
      title: 'Suba Sus Documentos',
      subtitle: 'Por favor suba sus documentos de identificación para verificación',
      driversLicense: 'Licencia de Conducir o ID Estatal',
      ssnCard: 'Tarjeta de Seguro Social',
      required: 'Requerido',
      optional: 'Opcional',
      dragDrop: 'Arrastre y suelte archivos aquí, o',
      browse: 'navegue para seleccionar',
      supportedFormats: 'Formatos soportados: JPG, PNG, PDF (máx. 10MB cada uno)',
      uploadAnother: 'Subir Otro Documento',
      processing: 'Procesando...',
      completed: 'Completado',
      error: 'Error',
      retry: 'Reintentar',
      remove: 'Eliminar',
      continue: 'Continuar',
      back: 'Atrás',
      ocrProcessing: 'Extrayendo información...',
      ocrCompleted: 'Información extraída exitosamente',
      ocrError: 'No se pudo extraer información. Verifique la calidad del documento.',
      documentTips: 'Consejos para Documentos',
      tip1: 'Asegúrese de que el documento esté bien iluminado y enfocado',
      tip2: 'Capture todo el documento',
      tip3: 'Evite reflejos y sombras',
      tip4: 'Use un fondo oscuro para contraste'
    }
  };

  const currentT = t[language];

  const requiredDocuments = [
    { type: 'drivers_license', label: currentT.driversLicense, required: true },
    { type: 'ssn_card', label: currentT.ssnCard, required: true }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        showToast('Please upload JPG, PNG, or PDF files only.', 'error');
        return false;
      }
      
      if (file.size > maxSize) {
        showToast('File size must be less than 10MB.', 'error');
        return false;
      }
      
      return true;
    });

    for (const file of validFiles) {
      const documentId = Date.now() + Math.random().toString(36);
      const preview = URL.createObjectURL(file);
      
      const newDocument: UploadedDocument = {
        id: documentId.toString(),
        name: file.name,
        type: 'other', // Let user select type manually
        file,
        preview,
        status: 'uploading'
      };

      setDocuments(prev => [...prev, newDocument]);
      
      try {
        await uploadDocument(newDocument);
      } catch (error) {
        updateDocumentStatus(documentId.toString(), 'error');
        showToast('Failed to upload document. Please try again.', 'error');
      }
    }
  };

  const detectDocumentType = (filename: string): 'drivers_license' | 'ssn_card' | 'passport' | 'other' => {
    const name = filename.toLowerCase();
    if (name.includes('license') || name.includes('dl') || name.includes('id')) {
      return 'drivers_license';
    } else if (name.includes('ssn') || name.includes('social') || name.includes('security')) {
      return 'ssn_card';
    } else if (name.includes('passport')) {
      return 'passport';
    }
    return 'other';
  };

  const uploadDocument = async (document: UploadedDocument) => {
    try {
      updateDocumentStatus(document.id, 'processing');
      
      const result = await onboardingService.uploadDocument(
        sessionId,
        document.file,
        document.type
      );
      
      if (result.success) {
        // Store the document information and OCR result (null if OCR is disabled)
        updateDocumentStatus(document.id, 'completed', result.ocrResult);
        
        if (result.ocrResult) {
          showToast(currentT.ocrCompleted, 'success');
        } else {
          showToast('Document uploaded successfully. OCR processing in progress...', 'info');
        }
      } else {
        updateDocumentStatus(document.id, 'error');
        showToast(currentT.ocrError, 'error');
      }
    } catch (error) {
      updateDocumentStatus(document.id, 'error');
      console.error('Upload error:', error);
      showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    }
  };

  const updateDocumentStatus = (id: string, status: UploadedDocument['status'], ocrData?: any) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, status, ocrData } : doc
    ));
  };

  const updateDocumentType = (id: string, type: UploadedDocument['type']) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, type } : doc
    ));
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const retryUpload = async (document: UploadedDocument) => {
    await uploadDocument(document);
  };

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'completed':
        return <Icon name="CheckCircle" size={16} className="text-green-600" />;
      case 'error':
        return <Icon name="AlertCircle" size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
        return currentT.processing;
      case 'processing':
        return currentT.ocrProcessing;
      case 'completed':
        return currentT.completed;
      case 'error':
        return currentT.error;
      default:
        return '';
    }
  };

  const canContinue = () => {
    const completedRequired = requiredDocuments.every(req => 
      documents.some(doc => doc.type === req.type && doc.status === 'completed')
    );
    return completedRequired;
  };

  const handleContinue = () => {
    const completedDocuments = documents.filter(doc => doc.status === 'completed');
    const combinedOcrData = completedDocuments.reduce((acc, doc) => {
      return { ...acc, ...doc.ocrData };
    }, {});
    
    onDocumentsUploaded(completedDocuments, combinedOcrData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      {/* Required Documents List */}
      <Card className="mb-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
        <div className="space-y-3">
          {requiredDocuments.map((doc) => {
            const uploaded = documents.find(d => d.type === doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="FileText" size={20} className="text-gray-400 mr-3" />
                  <span className="font-medium">{doc.label}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {doc.required ? currentT.required : currentT.optional}
                  </Badge>
                </div>
                <div className="flex items-center">
                  {uploaded ? (
                    <>
                      {getStatusIcon(uploaded.status)}
                      <span className="ml-2 text-sm text-gray-600">
                        {getStatusText(uploaded.status)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upload Area */}
      <Card className="mb-8 p-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Icon name="Upload" size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {currentT.dragDrop} <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {currentT.browse}
            </button>
          </p>
          <p className="text-sm text-gray-500">{currentT.supportedFormats}</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card className="mb-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={doc.preview}
                    alt={doc.name}
                    className="w-12 h-12 object-cover rounded-lg mr-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <select
                      value={doc.type}
                      onChange={(e) => updateDocumentType(doc.id, e.target.value as any)}
                      className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
                    >
                      <option value="drivers_license">{currentT.driversLicense}</option>
                      <option value="ssn_card">{currentT.ssnCard}</option>
                      <option value="passport">Passport</option>
                      <option value="other">Other Document</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(doc.status)}
                  <span className="text-sm text-gray-600">{getStatusText(doc.status)}</span>
                  {doc.status === 'error' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryUpload(doc)}
                    >
                      {currentT.retry}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                  >
                    {currentT.remove}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Document Tips */}
      <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                     <Icon name="AlertTriangle" size={20} className="mr-2" />
          {currentT.documentTips}
        </h3>
        <div className="space-y-2 text-blue-700 text-sm">
          <p>• {currentT.tip1}</p>
          <p>• {currentT.tip2}</p>
          <p>• {currentT.tip3}</p>
          <p>• {currentT.tip4}</p>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {currentT.back}
        </Button>
        
        <Button
          onClick={handleContinue}
          disabled={!canContinue()}
          className="min-w-[120px]"
        >
          {currentT.continue}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}; 