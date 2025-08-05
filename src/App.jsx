import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  console.log('App component rendering');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="bg-white shadow-soft border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900">C Choice</h1>
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Choice</h2>
            <p className="text-gray-600">The application is working!</p>
            <div className="mt-8 space-y-4">
              <a href="/profile" className="block p-4 bg-white rounded-lg shadow-soft border border-gray-200 hover:shadow-medium transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-gray-600">Manage your personal information</p>
              </a>
              <a href="/menu-scan" className="block p-4 bg-white rounded-lg shadow-soft border border-gray-200 hover:shadow-medium transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Scan Menu</h3>
                <p className="text-gray-600">Scan and analyze restaurant menus</p>
              </a>
              <a href="/recommendations" className="block p-4 bg-white rounded-lg shadow-soft border border-gray-200 hover:shadow-medium transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
                <p className="text-gray-600">View personalized dish recommendations</p>
              </a>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
