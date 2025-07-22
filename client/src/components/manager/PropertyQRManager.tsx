import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';
import QRCode from 'react-qr-code';

interface Department {
  id: string;
  name: string;
  positions: string[];
}

const DEPARTMENTS: Department[] = [
  { id: 'reception', name: 'Reception', positions: ['Front Desk Agent', 'Front Desk Supervisor'] },
  { id: 'housekeeping', name: 'Housekeeping', positions: ['Housekeeper', 'Housekeeping Supervisor'] },
  { id: 'maintenance', name: 'Maintenance', positions: ['Maintenance Technician', 'Maintenance Supervisor'] },
  { id: 'pool_services', name: 'Pool Services', positions: ['Lifeguard', 'Pool Attendant'] },
  { id: 'facilities', name: 'Facilities', positions: ['Facilities Manager', 'Security Guard'] }
];

export const PropertyQRManager: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);

  const generateQRCode = () => {
    if (!user?.organizationId) {
      showToast('Organization information not available', 'error');
      return;
    }

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      org: user.organizationId,
      ...(selectedDepartment !== 'all' && { dept: selectedDepartment })
    });
    
    const url = `${baseUrl}/jobs?${params.toString()}`;
    setQrCodeUrl(url);
    setShowQRCode(true);
  };

  const copyQRLink = () => {
    navigator.clipboard.writeText(qrCodeUrl);
    showToast('QR code link copied to clipboard', 'success');
  };

  const downloadQRCode = () => {
    const svg = document.querySelector('#property-qr-code svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `Property-${selectedDepartment}-QR.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="QrCode" className="mr-2" />
            Property Job Application QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Filter
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button onClick={generateQRCode} className="flex-1">
                <Icon name="QrCode" className="mr-2" size={16} />
                Generate QR Code
              </Button>
            </div>

            {showQRCode && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <div className="text-center space-y-4">
                  <div id="property-qr-code" className="bg-white p-4 rounded-lg inline-block">
                    <QRCode value={qrCodeUrl} size={200} level="M" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Scan to apply for {selectedDepartment === 'all' ? 'any position' : DEPARTMENTS.find(d => d.id === selectedDepartment)?.name + ' positions'}
                    </p>
                    <p className="text-xs text-gray-500 break-all">{qrCodeUrl}</p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={copyQRLink} size="sm">
                      <Icon name="Copy" className="mr-2" size={14} />
                      Copy Link
                    </Button>
                    <Button variant="outline" onClick={downloadQRCode} size="sm">
                      <Icon name="Download" className="mr-2" size={14} />
                      Download QR
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
