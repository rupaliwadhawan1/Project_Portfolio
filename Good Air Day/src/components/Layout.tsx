import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, BarChart2, CloudSun, Settings, Menu, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/forecast', icon: CloudSun, label: 'Forecast' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#baa0b9]">
      {/* Mobile Header - Fixed */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center p-4 bg-[#fcfcfc] text-brand-primary shadow-md">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-brand-secondary/10 mr-4"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div>
          <img 
            src="/logo.png" 
            alt="Good Air Day Logo" 
            className="h-8 w-auto"
          />
          <p className="text-sm opacity-90">Let's make everyday a good air day</p>
        </div>
      </div>

      {/* Sidebar Navigation - Fixed */}
      <nav className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed
        top-0
        left-0
        z-40
        w-64
        h-screen
        bg-[#fcfcfc]
        text-brand-primary
        shadow-lg
        transition-transform
        duration-300
        ease-in-out
        lg:transition-none
        flex
        flex-col
        overflow-hidden
      `}>
        {/* Logo Section - Fixed Height with padding */}
        <div className="p-6 h-[120px] flex-shrink-0 border-b border-gray-100">
          <img 
            src="/logo.png" 
            alt="Good Air Day Logo" 
            className="h-10 w-auto"
          />
          <p className="text-sm opacity-90 mt-2">Let's make everyday a good air day</p>
        </div>

        {/* Navigation Links - Scrollable with top padding */}
        <div className="flex-1 overflow-y-auto pt-4">
          <div className="space-y-2 px-4">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-primary text-brand-white'
                      : 'text-brand-primary hover:bg-brand-primary/10'
                  }`
                }
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        
        {/* Footer Section - Fixed Height */}
        <div className="h-[60px] flex-shrink-0 border-t border-gray-100">
          <a 
            href="https://www.rupaliwadhawan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-full flex items-center justify-center gap-2 text-sm text-brand-tertiary hover:text-brand-primary transition-all duration-200 group"
          >
            <span className="font-medium">Created by Rupali Wadhawan</span>
            <ExternalLink 
              size={14} 
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
            />
          </a>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content - Adjusted for fixed header on mobile */}
      <main className="flex-1 lg:ml-64 overflow-auto bg-[#baa0b9] pt-[88px] lg:pt-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}