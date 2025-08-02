import React from 'react';
import Camera from '../components/Camera';

const MenuScan = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">Menu Scanner</h1>
                          <p className="text-green-100 text-lg">Scan and analyze restaurant menus</p>
          </div>

          {/* Camera Section */}
          <div className="p-8">
            <Camera />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuScan; 