import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ 
  children, 
  content, 
  position = "top",
  className = "",
  maxWidth = "max-w-xs"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Détecter si c'est un appareil mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gestion des événements
  const handleShow = () => setIsVisible(true);
  const handleHide = () => setIsVisible(false);

  // Positionnement du tooltip
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  // Flèche du tooltip
  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-l-gray-800";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-r-gray-800";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-t-gray-800";
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={triggerRef}
      onMouseEnter={!isMobile ? handleShow : undefined}
      onMouseLeave={!isMobile ? handleHide : undefined}
      onTouchStart={isMobile ? handleShow : undefined}
      onTouchEnd={isMobile ? handleHide : undefined}
      onFocus={handleShow}
      onBlur={handleHide}
    >
      {children}
      
      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()} ${maxWidth}`}
          role="tooltip"
        >
          {/* Contenu du tooltip */}
          <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-xl border border-gray-700">
            <div className="text-center leading-relaxed">
              {content}
            </div>
            
            {/* Flèche */}
            <div className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClasses()}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
