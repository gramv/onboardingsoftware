import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Document {
  id: string;
  name: string;
  type: 'i9' | 'w4' | 'handbook' | 'policy' | 'id' | 'ssn' | 'other';
  status: 'pending' | 'completed' | 'signed' | 'expired';
  uploadedAt: string;
  signedAt?: string;
  size: string;
  required: boolean;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  documents: Document[];
}

export const DocumentCenter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock document data
  const documentCategories: DocumentCategory[] = [
    {
      id: 'onboarding',
      name: 'Onboarding Documents',
      description: 'Required documents for employment',
      icon: 'FileText',
      documents: [
        {
          id: '1',
          name: 'I-9 Employment Eligibility Verification',
          type: 'i9',
          status: 'signed',
          uploadedAt: '2024-01-15',
          signedAt: '2024-01-15',
          size: '2.3 MB',
          required: true,
        },
        {
          id: '2',
          name: 'W-4 Tax Withholding Form',
          type: 'w4',
          status: 'signed',
          uploadedAt: '2024-01-15',
          signedAt: '2024-01-15',
          size: '1.8 MB',
          required: true,
        },
      ],
    },
    {
      id: 'identification',
      name: 'Identification Documents',
      description: 'Identity verification documents',
      icon: 'Shield',
      documents: [
        {
          id: '3',
          name: 'Driver\'s License',
          type: 'id',
          status: 'completed',
          uploadedAt: '2024-01-15',
          size: '1.2 MB',
          required: true,
        },
        {
          id: '4',
          name: 'Social Security Card',
          type: 'ssn',
          status: 'completed',
          uploadedAt: '2024-01-15',
          size: '0.8 MB',
          required: true,
        },
      ],
    },
    {
      id: 'policies',
      name: 'Policies & Handbooks',
      description: 'Company policies and employee handbook',
      icon: 'Book',
      documents: [
        {
          id: '5',
          name: 'Employee Handbook 2024',
          type: 'handbook',
          status: 'signed',
          uploadedAt: '2024-01-10',
          signedAt: '2024-01-15',
          size: '5.2 MB',
          required: true,
        },
        {
          id: '6',
          name: 'Safety Policy',
          type: 'policy',
          status: 'pending',
          uploadedAt: '2024-01-16',
          size: '1.5 MB',
          required: true,
        },
      ],
    },
    {
      id: 'personal',
      name: 'Personal Documents',
      description: 'Additional personal documents',
      icon: 'User',
      documents: [
        {
          id: '7',
          name: 'Emergency Contact Form',
          type: 'other',
          status: 'completed',
          uploadedAt: '2024-01-15',
          size: '0.5 MB',
          required: false,
        },
      ],
    },
  ];

  const getAllDocuments = () => {
    return documentCategories.flatMap(category => category.documents);
  };

  const getFilteredDocuments = () => {
    if (activeCategory === 'all') {
      return getAllDocuments();
    }
    const category = documentCategories.find(cat => cat.id === activeCategory);
    return category ? category.documents : [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'signed':
        return 'Edit';
      case 'pending':
        return 'Clock';
      case 'expired':
        return 'AlertTriangle';
      default:
        return 'FileText';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'i9':
      case 'w4':
        return 'FileText';
      case 'handbook':
        return 'Book';
      case 'policy':
        return 'Shield';
      case 'id':
        return 'CreditCard';
      case 'ssn':
        return 'Lock';
      default:
        return 'File';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Uploading file:', file.name, 'Type:', selectedDocumentType);
      // Here you would typically upload the file to your server
      setShowUploadModal(false);
      setSelectedDocumentType('');
    }
  };

  const handleSignDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    console.log('Signature completed for document:', selectedDocument?.name);
    setShowSignatureModal(false);
    setSelectedDocument(null);
  };

  const renderDocumentCard = (document: Document) => (
    <Card key={document.id} className="hover:shadow-medium transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon name={getDocumentTypeIcon(document.type) as any} size={20} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{document.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Uploaded on {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Size: {document.size}
              </p>
              {document.signedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Signed on {new Date(document.signedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.status)}`}>
              <Icon name={getStatusIcon(document.status) as any} size={12} className="inline mr-1" />
              {document.status.toUpperCase()}
            </div>
            {document.required && (
              <span className="text-xs text-red-600 font-medium">REQUIRED</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-2">
            <Button size="sm" variant="ghost">
              <Icon name="Eye" size={16} className="mr-1" />
              View
            </Button>
            <Button size="sm" variant="ghost">
              <Icon name="Download" size={16} className="mr-1" />
              Download
            </Button>
          </div>
          
          {document.status === 'pending' && (
            <Button size="sm" onClick={() => handleSignDocument(document)}>
              <Icon name="Edit" size={16} className="mr-1" />
              Sign
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upload Document</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowUploadModal(false)}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
              </label>
              <select
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select document type</option>
                <option value="id">Driver's License / ID</option>
                <option value="ssn">Social Security Card</option>
                <option value="other">Other Document</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="Upload" size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button 
                disabled={!selectedDocumentType}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSignatureModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Digital Signature</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowSignatureModal(false)}>
              <Icon name="X" size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <Icon name="AlertCircle" size={16} className="inline mr-1" />
                You are about to digitally sign: <strong>{selectedDocument?.name}</strong>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signature Canvas
              </label>
              <div className="border-2 border-gray-300 rounded-lg bg-white" style={{ height: '200px' }}>
                <canvas
                  width="600"
                  height="200"
                  className="w-full h-full cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <Button size="sm" variant="ghost">
                  <Icon name="RotateCcw" size={16} className="mr-1" />
                  Clear
                </Button>
                <p className="text-xs text-gray-500 self-center">
                  Sign above using your mouse or touch screen
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <input type="checkbox" id="agreement" className="rounded" />
                <label htmlFor="agreement" className="text-sm text-gray-700 dark:text-gray-300">
                  I acknowledge that I have read and understood this document
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="consent" className="rounded" />
                <label htmlFor="consent" className="text-sm text-gray-700 dark:text-gray-300">
                  I consent to the use of electronic signatures
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowSignatureModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSignatureComplete}>
                <Icon name="Edit" size={16} className="mr-1" />
                Complete Signature
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Center</h2>
        <Button onClick={() => setShowUploadModal(true)}>
          <Icon name="Plus" size={16} className="mr-1" />
          Upload Document
        </Button>
      </div>

      {/* Document Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: getAllDocuments().length, color: 'text-blue-600' },
          { label: 'Completed', value: getAllDocuments().filter(d => d.status === 'completed' || d.status === 'signed').length, color: 'text-green-600' },
          { label: 'Pending Signature', value: getAllDocuments().filter(d => d.status === 'pending').length, color: 'text-yellow-600' },
          { label: 'Required', value: getAllDocuments().filter(d => d.required).length, color: 'text-red-600' },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === 'all' ? 'primary' : 'ghost'}
          onClick={() => setActiveCategory('all')}
        >
          All Documents
        </Button>
        {documentCategories.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={activeCategory === category.id ? 'primary' : 'ghost'}
            onClick={() => setActiveCategory(category.id)}
            leftIcon={<Icon name={category.icon as any} size={16} />}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {getFilteredDocuments().map(renderDocumentCard)}
      </div>

      {getFilteredDocuments().length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon name="FileText" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first document to get started
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Icon name="Plus" size={16} className="mr-1" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showUploadModal && renderUploadModal()}
      {showSignatureModal && renderSignatureModal()}
    </div>
  );
};