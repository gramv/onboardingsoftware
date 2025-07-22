/**
 * Device detection utilities for responsive onboarding experience
 */

export interface DeviceInfo {
  isTablet: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Get comprehensive device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Screen dimensions
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isLandscape = screenWidth > screenHeight;
  
  // Device type detection based on user agent and screen size
  const isMobileUA = /Mobile|Android|iPhone|iPod/.test(userAgent);
  const isTabletUA = /iPad|Android.*(?!Mobile)|Tablet/.test(userAgent);
  
  // Screen size classification
  let screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  if (screenWidth < 640) {
    screenSize = 'small';
  } else if (screenWidth < 768) {
    screenSize = 'medium';
  } else if (screenWidth < 1024) {
    screenSize = 'large';
  } else {
    screenSize = 'xlarge';
  }
  
  // Device classification logic
  let deviceType: 'mobile' | 'tablet' | 'desktop';
  let isTablet = false;
  let isMobile = false;
  let isDesktop = false;
  
  if (isTabletUA || (hasTouch && screenWidth >= 768 && screenWidth <= 1366)) {
    // Tablet: Has touch, screen width between 768px and 1366px, or explicit tablet UA
    deviceType = 'tablet';
    isTablet = true;
  } else if (isMobileUA || (hasTouch && screenWidth < 768)) {
    // Mobile: Has touch and small screen, or explicit mobile UA
    deviceType = 'mobile';
    isMobile = true;
  } else {
    // Desktop: Everything else
    deviceType = 'desktop';
    isDesktop = true;
  }
  
  return {
    isTablet,
    isMobile,
    isDesktop,
    hasTouch,
    screenSize,
    orientation: isLandscape ? 'landscape' : 'portrait',
    deviceType,
  };
};

/**
 * Check if device is suitable for tablet onboarding experience
 */
export const isTabletOnboardingSupported = (): boolean => {
  const device = getDeviceInfo();
  
  // Tablet onboarding is supported if:
  // 1. Device is classified as tablet, OR
  // 2. Device has touch and screen is medium/large size
  return device.isTablet || (device.hasTouch && ['medium', 'large'].includes(device.screenSize));
};

/**
 * Check if device should use enhanced tablet UI
 */
export const shouldUseTabletUI = (): boolean => {
  const device = getDeviceInfo();
  
  // Use tablet UI for tablets and large touch devices
  return device.isTablet || (device.hasTouch && device.screenSize === 'large');
};

/**
 * Get optimal touch target size for device
 */
export const getOptimalTouchTargetSize = (): number => {
  const device = getDeviceInfo();
  
  if (device.isMobile) {
    return 44; // iOS/Android standard
  } else if (device.isTablet) {
    return 48; // Comfortable tablet size
  } else {
    return 40; // Desktop with mouse
  }
};

/**
 * Custom hook for device detection with reactivity
 */
export const useDeviceDetection = () => {
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
  
  return deviceInfo;
};

// React import for useState and useEffect
import { useState, useEffect } from 'react';