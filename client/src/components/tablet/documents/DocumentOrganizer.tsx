import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { DocumentFile, DocumentType } from './DocumentCapture';

interface DocumentOrganizerProps {
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  onDocumentSelect: (document: DocumentFile) => void;
  onBack: () => void;
  language: 'en' | 'es';
  highContrast?: boolean;
  largeText?: boolean;
  className?: string;
}

type SortOption = 'name' | 'type' | 'quality' | 'timestamp';
type FilterOption = 'all' | DocumentType;

const DocumentOrganizer: React.FC<DocumentOrganizerProps> = ({
  documents,
  onDocumentsChange,
  onDocumentSelect,
  onBack,
  language,
  highContrast = false,
  largeText = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('timestamp');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const texts = {
    en: {
      title: 'Document Organizer',
      subtitle: 'Manage and organize your uploaded documents',
      search: 'Search documents...',
      sortBy: 'Sort by',
      filterBy: 'Filter by type',
      viewMode: 'View mode',
      grid: 'Grid',
      list: 'List',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      deleteSelected: 'Delete Selected',
      back: 'Back',
      noDocuments: 'No documents found',
      noResults: 'No documents match your search',
      sortOptions: {
        name: 'Name',
        type: 'Type',
        quality: 'Quality',
        timestamp: 'Date Added'
      },
      filterOptions: {
        all: 'All Documents',
        drivers_license: 'Driver\'s License',
        ssn_card: 'Social Security Card',
        passport: 'Passport',
        birth_certificate: 'Birth Certificate',
        other: 'Other'
      },
      documentCount: 'documents',
      selected: 'selected',
      quality: 'Quality',
      size: 'Size',
      added: 'Added',
      processed: 'Processed',
      needsReview: 'Needs Review'
    },
    es: {
      title: 'Organizador de Documentos',
      subtitle: 'Administre y organice sus documentos subidos',
      search: 'Buscar documentos...',
      sortBy: 'Ordenar por',
      filterBy: 'Filtrar por tipo',
      viewMode: 'Modo de vista',
      grid: 'Cuadrícula',
      list: 'Lista',
      selectAll: 'Seleccionar Todo',
      deselectAll: 'Deseleccionar Todo',
      deleteSelected: 'Eliminar Seleccionados',
      back: 'Atrás',
      noDocuments: 'No se encontraron documentos',
      noResults: 'Ningún documento coincide con su búsqueda',
      sortOptions: {
        name: 'Nombre',
        type: 'Tipo',
        quality: 'Calidad',
        timestamp: 'Fecha Agregada'
      },
      filterOptions: {
        all: 'Todos los Documentos',
        drivers_license: 'Licencia de Conducir',
        ssn_card: 'Tarjeta de Seguro Social',
        passport: 'Pasaporte',
        birth_certificate: 'Certificado de Nacimiento',
        other: 'Otro'
      },
      documentCount: 'documentos',
      selected: 'seleccionados',
      quality: 'Calidad',
      size: 'Tamaño',
      added: 'Agregado',
      processed: 'Procesado',
      needsReview: 'Necesita Revisión'
    }
  };

  const t = texts[language];

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file.name.toLowerCase().includes(query) ||
        t.filterOptions[doc.type].toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(doc => doc.type === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file.name.localeCompare(b.file.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'quality':
          return b.quality.score - a.quality.score;
        case 'timestamp':
          return b.timestamp.getTime() - a.timestamp.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, filterBy, sortBy, t.filterOptions]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US');
  };

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredAndSortedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDocuments.size === 0) return;

    const confirmMessage = language === 'es' 
      ? `¿Está seguro de que desea eliminar ${selectedDocuments.size} documento(s)?`
      : `Are you sure you want to delete ${selectedDocuments.size} document(s)?`;

    if (window.confirm(confirmMessage)) {
      const remainingDocuments = documents.filter(doc => !selectedDocuments.has(doc.id));
      onDocumentsChange(remainingDocuments);
      setSelectedDocuments(new Set());
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredAndSortedDocuments.map((document) => (
        <Card
          key={document.id}
          className={`p-3 cursor-pointer transition-all duration-200 ${
            selectedDocuments.has(document.id) 
              ? 'ring-2 ring-primary-500 bg-primary-50' 
              : 'hover:shadow-md'
          } ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}
        >
          {/* Selection Checkbox */}
          <div className="flex items-center justify-between mb-2">
            <input
              type="checkbox"
              checked={selectedDocuments.has(document.id)}
              onChange={() => handleSelectDocument(document.id)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div className={`px-2 py-1 rounded text-xs border ${getQualityBadgeColor(document.quality.score)} ${
              highContrast ? 'bg-gray-700 border-gray-600 text-white' : ''
            }`}>
              {document.quality.score}%
            </div>
          </div>

          {/* Document Preview */}
          <div 
            className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden"
            onClick={() => onDocumentSelect(document)}
          >
            <img
              src={document.preview}
              alt="Document preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Document Info */}
          <div className="space-y-1" onClick={() => onDocumentSelect(document)}>
            <p className={`text-xs font-medium truncate ${highContrast ? 'text-white' : 'text-gray-900'}`}>
              {document.file.name}
            </p>
            <p className={`text-xs ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
              {t.filterOptions[document.type]}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className={highContrast ? 'text-gray-400' : 'text-gray-400'}>
                {formatFileSize(document.file.size)}
              </span>
              {document.ocrData && (
                <div className={`w-2 h-2 rounded-full ${
                  document.ocrData.processingStatus === 'completed' ? 'bg-green-500' :
                  document.ocrData.processingStatus === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredAndSortedDocuments.map((document) => (
        <Card
          key={document.id}
          className={`p-4 cursor-pointer transition-all duration-200 ${
            selectedDocuments.has(document.id) 
              ? 'ring-2 ring-primary-500 bg-primary-50' 
              : 'hover:shadow-md'
          } ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}
          onClick={() => onDocumentSelect(document)}
        >
          <div className="flex items-center space-x-4">
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={selectedDocuments.has(document.id)}
              onChange={() => handleSelectDocument(document.id)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Document Thumbnail */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={document.preview}
                alt="Document preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Document Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-base' : 'text-sm'}`}>
                    {document.file.name}
                  </p>
                  <p className={`${highContrast ? 'text-gray-300' : 'text-gray-500'} ${largeText ? 'text-sm' : 'text-xs'}`}>
                    {t.filterOptions[document.type]}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 ml-4">
                  {/* Quality Score */}
                  <div className={`px-2 py-1 rounded text-xs border ${getQualityBadgeColor(document.quality.score)} ${
                    highContrast ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}>
                    {document.quality.score}%
                  </div>

                  {/* OCR Status */}
                  {document.ocrData && (
                    <div className={`px-2 py-1 rounded text-xs ${
                      document.ocrData.processingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      document.ocrData.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    } ${highContrast ? 'bg-gray-700 text-white' : ''}`}>
                      {document.ocrData.processingStatus === 'completed' ? t.processed :
                       document.ocrData.requiresReview ? t.needsReview :
                       document.ocrData.processingStatus}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span className={highContrast ? 'text-gray-400' : 'text-gray-500'}>
                    {t.size}: {formatFileSize(document.file.size)}
                  </span>
                  <span className={highContrast ? 'text-gray-400' : 'text-gray-500'}>
                    {t.added}: {formatTimestamp(document.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${highContrast ? 'text-white' : 'text-gray-900'} mb-1 ${largeText ? 'text-2xl' : 'text-xl'}`}>
            {t.title}
          </h2>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {filteredAndSortedDocuments.length} {t.documentCount}
            {selectedDocuments.size > 0 && ` • ${selectedDocuments.size} ${t.selected}`}
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

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={largeText ? 'text-lg' : ''}
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              largeText ? 'text-lg' : 'text-sm'
            } ${highContrast ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`}
          >
            <option value="timestamp">{t.sortOptions.timestamp}</option>
            <option value="name">{t.sortOptions.name}</option>
            <option value="type">{t.sortOptions.type}</option>
            <option value="quality">{t.sortOptions.quality}</option>
          </select>

          {/* Filter By */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${
              largeText ? 'text-lg' : 'text-sm'
            } ${highContrast ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`}
          >
            <option value="all">{t.filterOptions.all}</option>
            <option value="drivers_license">{t.filterOptions.drivers_license}</option>
            <option value="ssn_card">{t.filterOptions.ssn_card}</option>
            <option value="passport">{t.filterOptions.passport}</option>
            <option value="birth_certificate">{t.filterOptions.birth_certificate}</option>
            <option value="other">{t.filterOptions.other}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${largeText ? 'text-lg' : 'text-sm'} ${
                viewMode === 'grid' 
                  ? (highContrast ? 'bg-gray-600 text-white' : 'bg-primary-600 text-white')
                  : (highContrast ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50')
              }`}
            >
              {t.grid}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${largeText ? 'text-lg' : 'text-sm'} ${
                viewMode === 'list' 
                  ? (highContrast ? 'bg-gray-600 text-white' : 'bg-primary-600 text-white')
                  : (highContrast ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50')
              }`}
            >
              {t.list}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedDocuments.size === filteredAndSortedDocuments.length ? t.deselectAll : t.selectAll}
            </Button>
            
            {selectedDocuments.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {t.deleteSelected} ({selectedDocuments.size})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Document Display */}
      {filteredAndSortedDocuments.length === 0 ? (
        <Card className={`p-8 text-center ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
          <div className="text-4xl mb-4">📄</div>
          <h3 className={`font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-lg' : 'text-base'}`}>
            {documents.length === 0 ? t.noDocuments : t.noResults}
          </h3>
          {searchQuery && (
            <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
              Try adjusting your search or filters
            </p>
          )}
        </Card>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
    </div>
  );
};

export default DocumentOrganizer;