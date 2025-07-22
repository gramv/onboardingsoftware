import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import QRCode from 'react-qr-code';
import { useAuthStore } from '../../stores/authStore';

export const PropertyQRManager: React.FC = () => {
  const { user } = useAuthStore();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  const generateQRCode = async () => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/jobs?org=${user?.organizationId}`;
    setQrUrl(url);
    setShowQR(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Job Application QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        {!showQR ? (
          <Button onClick={generateQRCode}>
            <Icon name="QrCode" className="mr-2" />
            Generate QR Code
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <QRCode value={qrUrl} size={200} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Candidates can scan this QR code to apply for positions at your property
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigator.clipboard.writeText(qrUrl)}
                className="flex-1"
              >
                <Icon name="Copy" className="mr-2" />
                Copy URL
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowQR(false)}
                className="flex-1"
              >
                <Icon name="RefreshCw" className="mr-2" />
                Generate New
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
