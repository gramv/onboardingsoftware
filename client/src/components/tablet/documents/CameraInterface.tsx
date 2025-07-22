import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface CameraInterfaceProps {
  onCapture: (file: File) => void;
  language: 'en' | 'es';
  highContrast?: boolean;
  largeText?: boolean;
  className?: string;
}

const CameraInterface: React.FC<CameraInterfaceProps> = ({
  onCapture,
  language,
  highContrast = false,
  largeText = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [detectedDocument, setDetectedDocument] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<NodeJS.Timeout>();

  const texts = {
    en: {
      openCamera: 'Use Camera',
      closeCamera: 'Close Camera',
      capture: 'Capture Photo',
      retake: 'Retake',
      usePhoto: 'Use This Photo',
      autoCapture: 'Auto Capture',
      documentDetected: 'Document Detected',
      positionDocument: 'Position document within the frame',
      holdSteady: 'Hold steady...',
      permissionDenied: 'Camera permission denied',
      permissionRequest: 'Camera access is required to capture documents',
      allowCamera: 'Allow Camera Access',
      noCamera: 'No camera available',
      error: 'Camera error occurred'
    },
    es: {
      openCamera: 'Usar Cámara',
      closeCamera: 'Cerrar Cámara',
      capture: 'Capturar Foto',
      retake: 'Tomar Nuevamente',
      usePhoto: 'Usar Esta Foto',
      autoCapture: 'Captura Automática',
      documentDetected: 'Documento Detectado',
      positionDocument: 'Posicione el documento dentro del marco',
      holdSteady: 'Manténgase firme...',
      permissionDenied: 'Permiso de cámara denegado',
      permissionRequest: 'Se requiere acceso a la cámara para capturar documentos',
      allowCamera: 'Permitir Acceso a Cámara',
      noCamera: 'No hay cámara disponible',
      error: 'Ocurrió un error con la cámara'
    }
  };

  const t = texts[language];

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stream]);

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Start document detection
      startDocumentDetection();
      
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  const startDocumentDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(() => {
      detectDocument();
    }, 1000); // Check every second
  };

  const detectDocument = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Simple document detection based on edge detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and detect edges
    let edgeCount = 0;
    const threshold = 50;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      
      // Simple edge detection
      if (i > canvas.width * 4 && i < data.length - canvas.width * 4) {
        const prevGray = (data[i - canvas.width * 4] + data[i - canvas.width * 4 + 1] + data[i - canvas.width * 4 + 2]) / 3;
        const nextGray = (data[i + canvas.width * 4] + data[i + canvas.width * 4 + 1] + data[i + canvas.width * 4 + 2]) / 3;
        
        if (Math.abs(gray - prevGray) > threshold || Math.abs(gray - nextGray) > threshold) {
          edgeCount++;
        }
      }
    }
    
    // If we detect enough edges, assume there's a document
    const edgeRatio = edgeCount / (data.length / 4);
    const documentDetected = edgeRatio > 0.1 && edgeRatio < 0.4;
    
    setDetectedDocument(documentDetected);
    
    // Auto capture if enabled and document is detected
    if (autoCapture && documentDetected && !isCapturing && countdown === 0) {
      startCountdown();
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `document_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        onCapture(file);
        closeCamera();
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  }, [onCapture, isCapturing]);

  const openCamera = async () => {
    setIsOpen(true);
    if (hasPermission === null) {
      await requestCameraPermission();
    } else if (hasPermission && !stream) {
      await requestCameraPermission();
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    setIsOpen(false);
    setDetectedDocument(false);
    setCountdown(0);
  };

  if (!isOpen) {
    return (
      <Button
        variant="primary"
        size={largeText ? 'lg' : 'md'}
        onClick={openCamera}
        className={`h-20 flex flex-col items-center justify-center space-y-2 ${className}`}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className={largeText ? 'text-lg' : 'text-base'}>{t.openCamera}</span>
      </Button>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className={`p-6 text-center ${highContrast ? 'bg-gray-800 border-gray-600' : ''}`}>
        <div className="text-4xl mb-4">📷</div>
        <h3 className={`font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-xl' : 'text-lg'}`}>
          {t.permissionDenied}
        </h3>
        <p className={`mb-4 ${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
          {t.permissionRequest}
        </p>
        <div className="space-y-2">
          <Button onClick={requestCameraPermission} size={largeText ? 'lg' : 'md'}>
            {t.allowCamera}
          </Button>
          <Button variant="outline" onClick={closeCamera} size={largeText ? 'lg' : 'md'}>
            {t.closeCamera}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      <div className="relative w-full h-full">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Document Detection Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Document Frame */}
          <div className="absolute inset-4 border-2 border-dashed border-white rounded-lg flex items-center justify-center">
            <div className={`
              absolute inset-0 rounded-lg transition-colors duration-300
              ${detectedDocument 
                ? 'border-green-400 bg-green-400 bg-opacity-10' 
                : 'border-white bg-white bg-opacity-5'
              }
            `} />
            
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
          </div>
          
          {/* Status Messages */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-center">
              {countdown > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{countdown}</div>
                  <span>{t.holdSteady}</span>
                </div>
              ) : detectedDocument ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span>{t.documentDetected}</span>
                </div>
              ) : (
                <span>{t.positionDocument}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Close Button */}
            <Button
              variant="outline"
              size={largeText ? 'lg' : 'md'}
              onClick={closeCamera}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              {t.closeCamera}
            </Button>
            
            {/* Auto Capture Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">{t.autoCapture}</span>
              <button
                onClick={() => setAutoCapture(!autoCapture)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                  autoCapture ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span 
                  className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                    autoCapture 
                      ? 'bg-white transform translate-x-6' 
                      : 'bg-white'
                  }`} 
                />
              </button>
            </div>
            
            {/* Capture Button */}
            <Button
              variant="primary"
              size={largeText ? 'lg' : 'md'}
              onClick={capturePhoto}
              disabled={isCapturing || countdown > 0}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isCapturing ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                t.capture
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;