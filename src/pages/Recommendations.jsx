import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
// Note: legacy analysis helpers removed for MVP mode
import DishDetailsModal from '../components/DishDetailsModal';
import { createPortal } from 'react-dom';
import { scoreAndLabel } from '../lib/mvpRecommender';

// Tooltip Component using Portal
const Tooltip = ({ isVisible, targetRef, children }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' });

  useEffect(() => {
    if (isVisible && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = 260; // max-width of tooltip
      const tooltipHeight = 80; // estimated height
      const offset = 8;
      
      // Calculate available space
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      
      // Determine placement
      let placement = 'top';
      if (spaceAbove < tooltipHeight + offset && spaceBelow > tooltipHeight + offset) {
        placement = 'bottom';
      }
      
      // Calculate horizontal position
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      
      // Calculate vertical position
      let top;
      if (placement === 'top') {
        top = rect.top - tooltipHeight - offset;
      } else {
        top = rect.bottom + offset;
      }
      
      setPosition({ top, left, placement });
    }
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '260px'
      }}
    >
      <div className="bg-black text-white px-3.5 py-2.5 rounded-lg shadow-lg text-sm leading-relaxed">
        {children}
        <div 
          className={`absolute w-0 h-0 border-l-4 border-r-4 border-transparent ${
            position.placement === 'top' 
              ? 'top-full border-t-4 border-t-black' 
              : 'bottom-full border-b-4 border-b-black'
          }`}
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    </div>,
    document.body
  );
};

const Recommendations = () => {
  // No default recommendations - only use scanned menu dishes
  const defaultRecommendations = [];

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [menuText, setMenuText] = useState('');
  const [source, setSource] = useState('default');
  const [selectedDish, setSelectedDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const tooltipRefs = useRef({});

  // helpers
  const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
  const valOrTilde = v => (num(v) !== null && v > 0 ? v : '∼');
  const formatPrice = (p, cur) => (num(p) !== null ? `${p.toFixed(2)}${cur ? ' ' + cur : ''}` : '∼');
  useEffect(() => {
    console.log('🔄 Recommendations state changed:', recommendations.length, 'dishes');
    console.log('📊 Current recommendations:', recommendations);
  }, [recommendations]);

  // MVP: Détecter le payload MVP et utiliser les données appropriées
  useEffect(() => {
    console.log('🎯 Recommendations component mounted');
    console.log('📍 Location state:', location.state);
    console.log('📍 Location state keys:', location.state ? Object.keys(location.state) : 'null');

    // Détecter le payload MVP
    const mvpPayload = location.state?.mvp?.top3;
    const mvpAll = location.state?.mvp?.all;
    
    if (mvpPayload && mvpPayload.length > 0) {
      console.log('🎯 MVP mode detected - using mvp.top3 payload');
      console.log('[MVP] rendering top3 ->', mvpPayload.map(i => ({title: i.title, score: i.score, label: i.label})));
      
      setMenuText(location.state?.menuText || '');
      setSource(location.state?.source || 'scan');
      setRecommendations(mvpPayload);
      
      // Conserver all pour un affichage "More" ultérieur
      try {
        localStorage.setItem('lastRecommendations', JSON.stringify({
          recommendations: mvpAll || mvpPayload,
          menuText: location.state?.menuText || '',
          source: location.state?.source || 'scan',
          timestamp: Date.now()
        }));
      } catch {}
    } else {
      // Fallback vers l'ancien pipeline
      console.log('🔄 MVP mode not detected - using fallback pipeline');
      
      const scoredRecommendations = location.state?.recommendations || [];
      const allScoredDishes = location.state?.allRecommendations || [];

      console.log('[MVP] received scored recommendations:', scoredRecommendations.length);
      console.log('[MVP] received all scored dishes:', allScoredDishes.length);

      // Debug: afficher les données reçues
      if (scoredRecommendations.length > 0) {
        console.log('[MVP] parsed dishes ->', scoredRecommendations.map(d => d.title));
        console.table(allScoredDishes.map(x => ({ score: x.score, label: x.label, title: x.title })));
        console.log('[MVP] rendering top3 ->', scoredRecommendations.map(x => ({ score: x.score, label: x.label, title: x.title })));
      }

      setMenuText(location.state?.menuText || '');
      setSource(location.state?.source || 'scan');
      setRecommendations(scoredRecommendations);
      
      // Conserver all pour un affichage "More" ultérieur via localStorage léger
      try {
        localStorage.setItem('lastRecommendations', JSON.stringify({
          recommendations: allScoredDishes,
          menuText: location.state?.menuText || '',
          source: location.state?.source || 'scan',
          timestamp: Date.now()
        }));
      } catch {}
    }
  }, [location.state]);

  // MVP: Use top3 directly from scoreAndLabel - no additional sorting/filtering needed
  // The top3 is already sorted by score desc and balanced by category
  let filteredRecommendations = recommendations;

  const generateCategories = () => {
    return [
      { id: 'all', name: 'All', color: 'bg-gray-500' }
    ];
  };

  const categories = generateCategories();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Recommendations</h1>
                  <p className="text-purple-100 mt-2">Discover our personalized suggestions</p>
                </div>
                {source === 'scan' && (
                  <button
                    onClick={() => {
                      try { localStorage.removeItem('lastRecommendations'); } catch {}
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Clear saved recommendations"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by category</h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? `${category.color} text-white`
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="p-6">
              {/* Empty State */}
              {filteredRecommendations.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📷</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No dishes available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Scan a menu to get suggestions.
                    </p>
                    <button
                      onClick={() => navigate('/menu-scan')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      📸 Scan Menu
                    </button>
                  </div>
                </div>
              )}
              
              {filteredRecommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRecommendations.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="animate-fade-in-staggered bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      {/* Meta area - top right */}
                      <div className="relative p-4 pb-2">
                        {/* Price chip - top right */}
                        {typeof item.price === 'number' && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shadow-sm">
                              €{item.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        {/* Label badge - right side, adjusted to avoid price overlap */}
                        <div className="flex justify-end mb-2" style={{ marginRight: typeof item.price === 'number' ? '60px' : '0' }}>
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                            style={{
                              backgroundColor: item.label === 'Recovery' ? '#16a34a' : // green
                                            item.label === 'Healthy' ? '#0891b2' : // cyan/teal
                                            item.label === 'Comforting' ? '#f59e0b' : // orange
                                            '#6b7280' // gray for other
                            }}
                          >
                            {item.label || 'Other'}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight">
                          {item.title || item.name}
                        </h3>
                        
                        {/* Score pill - left side under title */}
                        <div className="mb-3">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{
                              backgroundColor: (item.score || 0) >= 8 ? '#10b981' : // emerald
                                            (item.score || 0) >= 6 ? '#f59e0b' : // amber
                                            '#f43f5e' // rose
                            }}
                          >
                            Personalized Match Score: {item.score ? `${item.score}/10` : 'N/A'}
                          </span>
                        </div>
                        
                        {/* Reasons chips - subtle chips under title */}
                        {item.reasons && item.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.reasons.slice(0, 2).map((reason, reasonIndex) => (
                              <span 
                                key={reasonIndex}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Content area */}
                      <div className="px-4 pb-4">
                        {/* Description */}
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => {
                            setSelectedDish({
                              name: item.title || item.name,
                              title: item.title || item.name,
                              description: item.description,
                              price: item.price,
                              score: item.score,
                              personalizedMatchScore: item.score,
                              label: item.label,
                              reasons: item.reasons,
                              // MVP specific fields
                              mvpScore: item.score,
                              mvpLabel: item.label,
                              mvpReasons: item.reasons
                            });
                            setIsModalOpen(true);
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dish Details Modal */}
      <DishDetailsModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedDish(null); }}
        dish={selectedDish}
      />
    </>
  );
};

export default Recommendations; 