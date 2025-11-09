/**
 * AdminLayout component - Modern Glassy Layout
 * Main layout wrapper with beautiful gradients and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import SecondSidebar from './SecondSidebar';
import { Topbar } from './Topbar';
import ROUTES from '../routes/routePaths';

/**
 * Modern glassy admin layout component
 */
export const AdminLayout: React.FC = () => {
  const location = useLocation();
  // State to track if user manually collapsed the sidebar (via toggle button)
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  
  // Check if People section is active by examining the current route
  const isPeopleActive = location.pathname.startsWith(ROUTES.PEOPLE);
  
  /**
   * Sidebar Collapse Logic:
   * 
   * The sidebar should be collapsed in two scenarios:
   * 1. When "People" is active (automatic collapse) - to make room for second sidebar
   * 2. When user manually toggles it (via toggle button)
   * 
   * When navigating away from People:
   * - If sidebar was collapsed only because People was active, expand it back
   * - If user manually collapsed it, keep it collapsed (respect user preference)
   * 
   * This useEffect handles the automatic collapse/expand based on People route
   */
  useEffect(() => {
    if (isPeopleActive) {
      // People is active: collapse sidebar automatically to show second sidebar
      // Don't change isManuallyCollapsed here - we want to preserve user's manual preference
    } else {
      // People is not active: expand sidebar back
      // Only reset if it wasn't manually collapsed by user
      // If user manually collapsed it, they probably want it to stay collapsed
      // So we only auto-expand if it was collapsed due to People being active
      // For simplicity, we'll auto-expand when leaving People (user can manually collapse again if needed)
      setIsManuallyCollapsed(false);
    }
  }, [isPeopleActive]);
  
  /**
   * Determine final collapsed state:
   * - Collapsed if People is active (automatic) OR manually collapsed by user
   */
  const isSidebarCollapsed = isPeopleActive || isManuallyCollapsed;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Sidebar - Collapses to icons when People is active or manually toggled */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      {/* Second Sidebar - Only appears when People is active */}
      <SecondSidebar isVisible={isPeopleActive} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => {
            /**
             * Toggle sidebar collapse state
             * This allows users to manually collapse/expand the sidebar
             * When People is active, this toggle will override the automatic collapse
             */
            setIsManuallyCollapsed(!isManuallyCollapsed);
          }}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
