import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

// Custom hook to track page views
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Get page name from pathname
    const pageName = location.pathname === '/' ? 'home' : location.pathname.slice(1);
    trackPageView(pageName);
  }, [location]);
};

export default usePageTracking;