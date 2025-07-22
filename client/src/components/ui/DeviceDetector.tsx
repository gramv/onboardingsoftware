import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceInfo, getDeviceInfo } from '../../utils/deviceDetection';

interface DeviceContextType {
  deviceInfo: DeviceInfo;
  isTabletMode: boolean;
  isMobileMode: boolean;
  isDesktopMode: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const contextValue: DeviceContextType = {
    deviceInfo,
    isTabletMode: deviceInfo.isTablet,
    isMobileMode: deviceInfo.isMobile,
    isDesktopMode: deviceInfo.isDesktop,
    hasTouch: deviceInfo.hasTouch,
    isLandscape: deviceInfo.orientation === 'landscape',
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

// HOC for device-specific rendering
export const withDeviceDetection = <P extends object>(
  Component: React.ComponentType<P & { device: DeviceContextType }>
) => {
  return (props: P) => {
    const device = useDevice();
    return <Component {...props} device={device} />;
  };
};

// Responsive component for conditional rendering
interface ResponsiveProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  children?: React.ReactNode;
}

export const Responsive: React.FC<ResponsiveProps> = ({ mobile, tablet, desktop, children }) => {
  const { isTabletMode, isMobileMode, isDesktopMode } = useDevice();

  if (isMobileMode && mobile) return <>{mobile}</>;
  if (isTabletMode && tablet) return <>{tablet}</>;
  if (isDesktopMode && desktop) return <>{desktop}</>;
  
  return <>{children}</>;
};