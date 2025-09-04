import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightSidebar from './RightSidebar';
import MobileNavigation from './MobileNavigation';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const showRightSidebar = location.pathname === '/' || location.pathname === '/home';
  const isFitnessPage = location.pathname === '/fitness';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on fitness page */}
      {!isFitnessPage && <Sidebar />}
      
      {/* Header - hidden on mobile and fitness page */}
      {!isFitnessPage && <Header />}
      
      {/* Main Content */}
      <main className={`${!isFitnessPage ? 'md:ml-64 md:pt-16' : ''} ${!isFitnessPage ? 'pb-20 md:pb-6' : ''} ${showRightSidebar && !isFitnessPage ? 'xl:mr-80' : ''}`}>
        {!isFitnessPage && (
          <div
            className="container mx-auto px-4 py-2"
            style={{
              paddingLeft: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingTop: 0,
            }}
          >
            {children}
          </div>
        )}
        {isFitnessPage && children}
      </main>
      
      {/* Right Sidebar - only on home page */}
      {showRightSidebar && !isFitnessPage && <RightSidebar />}
      
      {/* Mobile Navigation - hidden on fitness page */}
      {!isFitnessPage && <MobileNavigation />}
    </div>
  );
}
