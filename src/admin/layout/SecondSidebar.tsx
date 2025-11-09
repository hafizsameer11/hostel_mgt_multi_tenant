/**
 * SecondSidebar Component
 * 
 * This component displays a nested sidebar that appears when "People" is selected.
 * It shows the Directory navigation with: Tenants, Owners, Vendors, Prospects
 * 
 * Features:
 * - Smooth slide-in/slide-out animation
 * - Active section highlighting
 * - Search functionality
 * - Back navigation
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ROUTES from '../routes/routePaths';

interface SecondSidebarProps {
  isVisible: boolean;
}

interface PeopleSection {
  id: string;
  label: string;
  path: string;
}

const SecondSidebar: React.FC<SecondSidebarProps> = ({ isVisible }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get active section from URL
  const getActiveSection = (): string | null => {
    if (location.pathname.includes('/tenants')) return 'Tenants';
    if (location.pathname.includes('/employees')) return 'Employees';
    if (location.pathname.includes('/owners')) return 'Owners';
    // if (location.pathname.includes('/vendors')) return 'Vendors';
    if (location.pathname.includes('/prospects')) return 'Prospects';
    return null;
  };

  const activeSection = getActiveSection();

  // Directory sections
  const peopleSections: PeopleSection[] = [
    { id: 'Tenants', label: 'Tenants', path: ROUTES.TENANTS },
    { id: 'Employees', label: 'Employees', path: ROUTES.EMPLOYEES },
    { id: 'Owners', label: 'Owners', path: ROUTES.OWNERS },
    // { id: 'Vendors', label: 'Vendors', path: ROUTES.VENDORS },
    // { id: 'Prospects', label: 'Prospects', path: ROUTES.PROSPECTS },
  ];

  /**
   * SecondSidebar Component:
   * 
   * This nested sidebar appears when "People" is selected in the main sidebar.
   * It displays the Directory navigation with sub-items: Tenants, Employees, Owners, Vendors, Prospects
   * 
   * Props:
   * - isVisible: Boolean that controls whether the sidebar should be shown
   * 
   * Animation:
   * - Slides in from 0px to 240px width when isVisible becomes true
   * - Slides out from 240px to 0px when isVisible becomes false
   * - Uses AnimatePresence to handle mount/unmount animations smoothly
   * 
   * State Management:
   * - Visibility is controlled by parent (AdminLayout) based on route
   * - Automatically hides when navigating away from People section
   */
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}      // Start: Hidden, no width
          animate={{ width: 240, opacity: 1 }}     // End: Visible, 240px wide
          exit={{ width: 0, opacity: 0 }}          // Exit: Hide again, collapse width
          transition={{ 
            duration: 0.3,      // Animation duration: 300ms
            ease: 'easeInOut'   // Smooth transition
          }}
          className="h-screen bg-[#1A2B4D] border-r border-white/10 flex flex-col overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent border-b border-white/30 text-white placeholder-white/60 px-0 py-2 text-sm focus:outline-none focus:border-white transition-colors"
              />
              <span className="absolute right-0 top-2 text-white/60 text-xs">⌘K</span>
            </div>
          </div>

          {/* Directory Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Back Navigation */}
            <button
              onClick={() => navigate('/admin/overview')}
              className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-medium transition-colors mb-4"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-bold">PEOPLE</span>
            </button>

            {/* Directory Label */}
            <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              DIRECTORY
            </h2>

            {/* Directory Items */}
            <nav className="space-y-1">
              {peopleSections.map((section) => {
                const isSectionActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => navigate(section.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isSectionActive
                        ? 'bg-[#2176FF] text-white shadow-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default SecondSidebar;

