import React from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Vote, 
  BarChart3, 
  Settings, 
  LogOut, 
  Users, 
  Calendar,
  Shield,
  User,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAdmin = user?.roles.includes(USER_ROLES.ADMINISTRATOR);

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      roles: ['student', 'administrator', 'electoral_committee', 'candidate']
    },
    { 
      path: '/elections', 
      label: 'Elecciones', 
      icon: Vote,
      roles: ['student', 'administrator', 'electoral_committee', 'candidate']
    },
    { 
      path: '/active-elections', 
      label: 'Votar', 
      icon: Activity,
      roles: ['student', 'administrator', 'electoral_committee', 'candidate']
    },
    { 
      path: '/admin', 
      label: 'Administración', 
      icon: Shield,
      roles: ['administrator']
    },
    { 
      path: '/admin/elections', 
      label: 'Gestionar Elecciones', 
      icon: Calendar,
      roles: ['administrator']
    },
    { 
      path: '/admin/vote-simulator', 
      label: 'Simulador de Votos', 
      icon: Activity,
      roles: ['administrator']
    },
    { 
      path: '/admin/users', 
      label: 'Gestión de Usuarios', 
      icon: Users,
      roles: ['administrator']
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.some(role => user?.roles.includes(role as any))
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-200"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">UNAB Voting</h1>
        </div>
        
        <nav className="mt-6 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-3 text-sm font-medium transition-colors duration-200 rounded-lg mb-1 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 w-full border-t border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'Administrador' : 'Estudiante'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8 pt-16 lg:pt-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}