import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  contentMaxWidth: number;
  sidebarWidth: number;
}

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

const CONTENT_MAX_WIDTH = 630;
const SIDEBAR_WIDTH = 240;

const getBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

const getResponsiveInfo = (dimensions: ScaledSize): ResponsiveInfo => {
  const { width, height } = dimensions;
  const breakpoint = getBreakpoint(width);
  
  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    contentMaxWidth: CONTENT_MAX_WIDTH,
    sidebarWidth: SIDEBAR_WIDTH,
  };
};

export function useResponsive(): ResponsiveInfo {
  const [responsive, setResponsive] = useState<ResponsiveInfo>(
    getResponsiveInfo(Dimensions.get('window'))
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setResponsive(getResponsiveInfo(window));
    });

    return () => subscription?.remove();
  }, []);

  return responsive;
}

export { BREAKPOINTS, CONTENT_MAX_WIDTH, SIDEBAR_WIDTH };
