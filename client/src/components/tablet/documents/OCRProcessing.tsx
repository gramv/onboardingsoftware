import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { DocumentFile, OCRData } from './DocumentCapture';

interface OCRProcessingProps {
  document: DocumentFile;
  onComplete: (ocrData: OCRData) => void;
  onBack: () => void;
  language: 'en' | 'es';
  highContrast?: boolean;
  largeText?: boolean;
  className?: string;
}

interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  isEditable: boolean;
  suggestions?: string[];
}

const OCRProcessing: React.FC<OCRProcessingProps> = ({
  document,
  onComplete,
  onBack,
  language,
  highContrast = false,
  largeText = false,
  className = ''
}) => {
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [rawText, setRawText] = useState('');
  const [overallConfidence, setOverallConfidence] = useState(0);

  const texts = {
    en: {
      title: 'OCR Processing',
      subtitle: 'Extracting text from your document',
      processing: 'Processing document...',
      completed: 'Processing completed',
      failed: 'Processing failed',
      retry: 'Retry Processing',
      confidence: 'Confidence',
      lowConfidence: 'Low confidence - please review',
      mediumConfidence: 'Medium confidence - verify if needed',
      highConfidence: 'High confidence',
      editField: 'Edit Field',
      saveField: 'Save',
      cancelEdit: 'Cancel',
      suggestions: 'Suggestions',
      rawText: 'Raw Text',
      showRawText: 'Show Raw Text',
      hideRawText: 'Hide Raw Text',
      reviewRequired: 'Manual review required',
      acceptResults: 'Accept Results',
      back: 'Back',
      noDataExtracted: 'No data could be extracted from this document',
      tryAgain: 'Try processing again or enter data manually',
      fieldLabels: {
        firstName: 'First Name',
        lastName: 'Last Name',
        middleName: 'Middle Name',
        dateOfBirth: 'Date of Birth',
        licenseNumber: 'License Number',
        expirationDate: 'Expiration Date',
        address: 'Address',
        city: 'City',
        state: 'State',
        zipCode: 'ZIP Code',
        ssn: 'Social Security Number',
        issuedDate: 'Issued Date',
        documentNumber: 'Document Number'
      }
    },
    es: {
      title: 'Procesamiento OCR',
      subtitle: 'Extrayendo texto de su documento',
      processing: 'Procesando documento...',
      completed: 'Procesamiento completado',
      failed: 'Procesamiento falló',
      retry: 'Reintentar Procesamiento',
      confidence: 'Confianza',
      lowConfidence: 'Baja confianza - por favor revise',
      mediumConfidence: 'Confianza media - verifique si es necesario',
      highConfidence: 'Alta confianza',
      editField: 'Editar Campo',
      saveField: 'Guardar',
      cancelEdit: 'Cancelar',
      suggestions: 'Sugerencias',
      rawText: 'Texto Sin Procesar',
      showRawText: 'Mostrar Texto Sin Procesar',
      hideRawText: 'Ocultar Texto Sin Procesar',
      reviewRequired: 'Revisión manual requerida',
      acceptResults: 'Aceptar Resultados',
      back: 'Atrás',
      noDataExtracted: 'No se pudieron extraer datos de este documento',
      tryAgain: 'Intente procesar nuevamente o ingrese los datos manualmente',
      fieldLabels: {
        firstName: 'Nombre',
        lastName: 'Apellido',
        middleName: 'Segundo Nombre',
        dateOfBirth: 'Fecha de Nacimiento',
        licenseNumber: 'Número de Licencia',
        expirationDate: 'Fecha de Vencimiento',
        address: 'Dirección',
        city: 'Ciudad',
        state: 'Estado',
        zipCode: 'Código Postal',
        ssn: 'Número de Seguro Social',
        issuedDate: 'Fecha de Emisión',
        documentNumber: 'Número de Documento'
      }
    }
  };

  const t = texts[language];

  // Mock OCR processing function
  const processOCR = useCallback(async (): Promise<OCRData> => {
    setProcessingStatus('processing');
    setProgress(0);

    // Simulate processing with progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    clearInterval(progressInterval);
    setProgress(100);

    // Mock extracted data based on document type
    let mockData: Record<string, any> = {};
    let mockConfidences: Record<string, number> = {};
    let mockRawText = '';

    if (document.type === 'drivers_license') {
      mockData = {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        dateOfBirth: '1990-05-15',
        licenseNumber: 'D123456789',
        expirationDate: '2025-05-15',
        address: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      };
      mockConfidences = {
        firstName: 0.95,
        lastName: 0.92,
        middleName: 0.78,
        dateOfBirth: 0.88,
        licenseNumber: 0.96,
        expirationDate: 0.85,
        address: 0.82,
        city: 0.90,
        state: 0.98,
        zipCode: 0.87
      };
      mockRawText = 'CALIFORNIA DRIVER LICENSE\nDOE, JOHN MICHAEL\nDOB: 05/15/1990\nDL: D123456789\nEXP: 05/15/2025\n123 MAIN STREET\nANYTOWN, CA 12345';
    } else if (document.type === 'ssn_card') {
      mockData = {
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        ssn: '123-45-6789'
      };
      mockConfidences = {
        firstName: 0.93,
        lastName: 0.91,
        middleName: 0.75,
        ssn: 0.97
      };
      mockRawText = 'SOCIAL SECURITY\n123-45-6789\nJOHN MICHAEL DOE\nTHIS NUMBER HAS BEEN ESTABLISHED FOR\nJOHN MICHAEL DOE';
    } else {
      // Generic document
      mockData = {
        documentNumber: 'DOC123456',
        issuedDate: '2023-01-15'
      };
      mockConfidences = {
        documentNumber: 0.85,
        issuedDate: 0.80
      };
      mockRawText = 'OFFICIAL DOCUMENT\nDOCUMENT NUMBER: DOC123456\nISSUED: 01/15/2023';
    }

    // Add some randomness to confidence scores
    Object.keys(mockConfidences).forEach(key => {
      mockConfidences[key] = Math.max(0.6, mockConfidences[key] + (Math.random() - 0.5) * 0.2);
    });

    const avgConfidence = Object.values(mockConfidences).reduce((a, b) => a + b, 0) / Object.values(mockConfidences).length;
    const requiresReview = avgConfidence < 0.85 || Object.values(mockConfidences).some(conf => conf < 0.8);

    setProcessingStatus('completed');

    return {
      extractedFields: mockData,
      confidenceScores: mockConfidences,
      rawText: mockRawText,
      processingStatus: 'completed',
      requiresReview
    };
  }, [document.type]);

  // Start OCR processing on component mount
  useEffect(() => {
    const startProcessing = async () => {
      try {
        const ocrData = await processOCR();
        setRawText(ocrData.rawText);
        setOverallConfidence(
          Object.values(ocrData.confidenceScores).reduce((a, b) => a + b, 0) / 
          Object.values(ocrData.confidenceScores).length
        );

        // Convert to ExtractedField format
        const fields: ExtractedField[] = Object.entries(ocrData.extractedFields).map(([key, value]) => ({
          key,
          label: t.fieldLabels[key as keyof typeof t.fieldLabels] || key,
          value: String(value),
          confidence: ocrData.confidenceScores[key] || 0,
          isEditable: true,
          suggestions: generateSuggestions(key, String(value))
        }));

        setExtractedFields(fields);
      } catch (error) {
        console.error('OCR processing failed:', error);
        setProcessingStatus('failed');
      }
    };

    startProcessing();
  }, [processOCR, t.fieldLabels]);

  const generateSuggestions = (fieldKey: string, value: string): string[] => {
    // Generate smart suggestions based on field type and common patterns
    const suggestions: string[] = [];

    if (fieldKey === 'dateOfBirth' || fieldKey === 'expirationDate' || fieldKey === 'issuedDate') {
      // Date format suggestions
      if (value.includes('/')) {
        suggestions.push(value.replace(/\//g, '-'));
      }
      if (value.includes('-')) {
        suggestions.push(value.replace(/-/g, '/'));
      }
    } else if (fieldKey === 'zipCode') {
      // ZIP code format suggestions
      if (value.length === 5 && !value.includes('-')) {
        suggestions.push(value + '-0000');
      }
    } else if (fieldKey === 'ssn') {
      // SSN format suggestions
      const digits = value.replace(/\D/g, '');
      if (digits.length === 9) {
        suggestions.push(`${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`);
        suggestions.push(`${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`);
      }
    } else if (fieldKey === 'firstName' || fieldKey === 'lastName' || fieldKey === 'middleName') {
      // Name capitalization suggestions
      suggestions.push(value.toLowerCase());
      suggestions.push(value.toUpperCase());
      suggestions.push(value.charAt(0).toUpperCase() + value.slice(1).toLowerCase());
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const handleFieldEdit = (fieldKey: string, newValue: string) => {
    setExtractedFields(prev => 
      prev.map(field => 
        field.key === fieldKey 
          ? { ...field, value: newValue, confidence: Math.max(field.confidence, 0.9) }
          : field
      )
    );
  };

  const handleSuggestionSelect = (fieldKey: string, suggestion: string) => {
    handleFieldEdit(fieldKey, suggestion);
    setEditingField(null);
  };

  const handleAcceptResults = () => {
    const finalData: OCRData = {
      extractedFields: extractedFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, any>),
      confidenceScores: extractedFields.reduce((acc, field) => {
        acc[field.key] = field.confidence;
        return acc;
      }, {} as Record<string, number>),
      rawText,
      processingStatus: 'completed',
      requiresReview: extractedFields.some(field => field.confidence < 0.8)
    };

    onComplete(finalData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 border-green-200';
    if (confidence >= 0.7) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return t.highConfidence;
    if (confidence >= 0.7) return t.mediumConfidence;
    return t.lowConfidence;
  };

  if (processingStatus === 'processing') {
    return (
      <div className={`${className} flex flex-col items-center justify-center min-h-96 space-y-6`}>
        <div className="text-6xl animate-pulse">🔍</div>
        <div className="text-center space-y-4">
          <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-2xl' : 'text-xl'}`}>
            {t.processing}
          </h2>
          <div className="w-64 bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {Math.round(progress)}% {t.completed.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  if (processingStatus === 'failed') {
    return (
      <div className={`${className} flex flex-col items-center justify-center min-h-96 space-y-6`}>
        <div className="text-6xl">❌</div>
        <div className="text-center space-y-4">
          <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-2xl' : 'text-xl'}`}>
            {t.failed}
          </h2>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {t.tryAgain}
          </p>
          <div className="flex space-x-4">
            <Button onClick={() => processOCR()} size={largeText ? 'lg' : 'md'}>
              {t.retry}
            </Button>
            <Button variant="outline" onClick={onBack} size={largeText ? 'lg' : 'md'}>
              {t.back}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} mb-1 ${largeText ? 'text-2xl' : 'text-xl'}`}>
            {t.title}
          </h2>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {t.completed} - {t.confidence}: {Math.round(overallConfidence * 100)}%
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

      {/* Overall Status */}
      {extractedFields.some(field => field.confidence < 0.8) && (
        <Card className={`p-4 border-l-4 border-yellow-500 bg-yellow-50 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className={`font-medium ${highContrast ? 'text-white' : 'text-yellow-800'} ${largeText ? 'text-base' : 'text-sm'}`}>
              {t.reviewRequired}
            </p>
          </div>
        </Card>
      )}

      {/* Extracted Fields */}
      {extractedFields.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extractedFields.map((field) => (
            <Card key={field.key} className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`font-medium ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-base' : 'text-sm'}`}>
                    {field.label}
                  </label>
                  <div className={`px-2 py-1 rounded text-xs border ${getConfidenceBgColor(field.confidence)} ${highContrast ? 'bg-gray-700 border-gray-600' : ''}`}>
                    <span className={getConfidenceColor(field.confidence)}>
                      {Math.round(field.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {editingField === field.key ? (
                  <div className="space-y-2">
                    <Input
                      value={field.value}
                      onChange={(e) => handleFieldEdit(field.key, e.target.value)}
                      className={largeText ? 'text-lg' : ''}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => setEditingField(null)}
                      >
                        {t.saveField}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingField(null)}
                      >
                        {t.cancelEdit}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div 
                      className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                        field.confidence < 0.8 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      } ${highContrast ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : ''}`}
                      onClick={() => setEditingField(field.key)}
                    >
                      <p className={`${largeText ? 'text-base' : 'text-sm'} ${highContrast ? 'text-white' : 'text-gray-900'}`}>
                        {field.value || 'No value detected'}
                      </p>
                    </div>
                    
                    {field.suggestions && field.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <p className={`${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                          {t.suggestions}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {field.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionSelect(field.key, suggestion)}
                              className={`px-2 py-1 text-xs rounded border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 ${
                                highContrast ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500' : ''
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className={`${largeText ? 'text-sm' : 'text-xs'} ${getConfidenceColor(field.confidence)}`}>
                  {getConfidenceLabel(field.confidence)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`p-8 text-center ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
          <div className="text-4xl mb-4">📄</div>
          <h3 className={`font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
            {t.noDataExtracted}
          </h3>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {t.tryAgain}
          </p>
        </Card>
      )}

      {/* Raw Text Section */}
      <Card className={`p-4 ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
            {t.rawText}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawText(!showRawText)}
          >
            {showRawText ? t.hideRawText : t.showRawText}
          </Button>
        </div>
        
        {showRawText && (
          <div className={`p-3 rounded border bg-gray-50 ${highContrast ? 'bg-gray-700 border-gray-600' : 'border-gray-200'}`}>
            <pre className={`whitespace-pre-wrap ${largeText ? 'text-sm' : 'text-xs'} ${highContrast ? 'text-gray-300' : 'text-gray-700'}`}>
              {rawText || 'No raw text available'}
            </pre>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          size={largeText ? 'lg' : 'md'}
          onClick={() => processOCR()}
        >
          {t.retry}
        </Button>
        <Button
          variant="primary"
          size={largeText ? 'lg' : 'md'}
          onClick={handleAcceptResults}
          disabled={extractedFields.length === 0}
        >
          {t.acceptResults}
        </Button>
      </div>
    </div>
  );
};

export default OCRProcessing;