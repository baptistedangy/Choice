import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">Profil Utilisateur</h1>
            <p className="text-primary-100 text-lg">Gérez vos informations personnelles</p>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="w-36 h-36 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-large">
                  <span className="text-5xl font-bold text-white">JD</span>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">John Doe</h2>
                  <p className="text-gray-600 text-lg">john.doe@example.com</p>
                </div>
                <button className="btn btn-primary">
                  Modifier la photo
                </button>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+33 6 12 34 56 78"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Informations détaillées
                  </label>
                  <button
                    onClick={() => navigate('/extended-profile')}
                    className="w-full btn btn-secondary py-4 text-base font-semibold shadow-medium hover:shadow-large transition-all duration-200 transform hover:-translate-y-1"
                  >
                    Complete my information
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Ajoutez votre âge, poids, objectifs et préférences alimentaires pour des recommandations personnalisées
                  </p>
                </div>

                <button className="w-full btn btn-primary py-4 text-base">
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 