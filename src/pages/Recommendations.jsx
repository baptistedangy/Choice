import React, { useState } from 'react';

const Recommendations = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const recommendations = [
    {
      id: 1,
      name: 'Salade César',
      restaurant: 'Le Bistrot Parisien',
      price: '14.50€',
      rating: 4.8,
      category: 'healthy',
      description: 'Salade fraîche avec poulet grillé, parmesan et croûtons',
      image: '🥗',
      tags: ['Végétarien', 'Sans gluten']
    },
    {
      id: 2,
      name: 'Burger Végétarien',
      restaurant: 'Green Kitchen',
      price: '16.00€',
      rating: 4.6,
      category: 'vegetarian',
      description: 'Burger aux légumes avec galette de quinoa et fromage de chèvre',
      image: '🍔',
      tags: ['Végétarien', 'Bio']
    },
    {
      id: 3,
      name: 'Poke Bowl Saumon',
      restaurant: 'Sushi Express',
      price: '18.50€',
      rating: 4.9,
      category: 'healthy',
      description: 'Bowl de riz avec saumon frais, avocat et légumes',
      image: '🍣',
      tags: ['Poisson', 'Sain']
    },
    {
      id: 4,
      name: 'Pizza Margherita',
      restaurant: 'Pizza Roma',
      price: '13.00€',
      rating: 4.5,
      category: 'classic',
      description: 'Pizza traditionnelle avec mozzarella et basilic frais',
      image: '🍕',
      tags: ['Végétarien', 'Italien']
    },
    {
      id: 5,
      name: 'Pasta Carbonara',
      restaurant: 'Trattoria Bella',
      price: '15.50€',
      rating: 4.7,
      category: 'classic',
      description: 'Pâtes aux œufs, lardons et parmesan',
      image: '🍝',
      tags: ['Italien', 'Classique']
    },
    {
      id: 6,
      name: 'Smoothie Bowl',
      restaurant: 'Fresh & Co',
      price: '12.00€',
      rating: 4.4,
      category: 'healthy',
      description: 'Bowl de smoothie avec fruits frais et granola',
      image: '🥣',
      tags: ['Végétarien', 'Végan', 'Sain']
    }
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Toutes', color: 'bg-gray-500' },
    { id: 'healthy', name: 'Sain', color: 'bg-green-500' },
    { id: 'vegetarian', name: 'Végétarien', color: 'bg-emerald-500' },
    { id: 'classic', name: 'Classique', color: 'bg-blue-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Recommandations</h1>
            <p className="text-purple-100 mt-2">Découvrez nos suggestions personnalisées</p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer par catégorie</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendations.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{item.image}</div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-medium text-gray-900">{item.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.restaurant}</p>
                    <p className="text-sm text-gray-700 mb-4">{item.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">{item.price}</span>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRecommendations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune recommandation trouvée</h3>
                <p className="text-gray-600">Essayez de modifier vos filtres pour voir plus d'options</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations; 