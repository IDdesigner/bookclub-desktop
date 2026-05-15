import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Books', href: '/books', icon: '📚' },
  { name: 'Classes', href: '/classes', icon: '🎓' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Book Club</h1>
      </div>
      <nav className="mt-6 flex-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
        >
          <span className="mr-3 text-xl">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}
