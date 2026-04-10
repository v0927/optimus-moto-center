import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile  = size.width < 640;
  const isTablet  = size.width >= 640 && size.width < 1024;
  const isDesktop = size.width >= 1024;

  return { ...size, isMobile, isTablet, isDesktop };
}