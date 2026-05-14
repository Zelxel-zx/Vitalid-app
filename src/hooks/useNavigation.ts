import { useState, useCallback } from 'react';
import { View } from '../types';

interface NavigationState {
  currentView: View;
  selectedDoctor: number | null;
  mobileMenuOpen: boolean;
}

export function useNavigation() {
  const [navState, setNavState] = useState<NavigationState>({
    currentView: 'home',
    selectedDoctor: null,
    mobileMenuOpen: false
  });

  const setCurrentView = useCallback((view: View) => {
    setNavState(prev => ({ ...prev, currentView: view }));
  }, []);

  const setSelectedDoctor = useCallback((doctorId: number | null) => {
    setNavState(prev => ({ ...prev, selectedDoctor: doctorId }));
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setNavState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }));
  }, []);

  const handleDoctorClick = useCallback((doctorId: number) => {
    setNavState(prev => ({
      ...prev,
      selectedDoctor: doctorId,
      currentView: 'messages'
    }));
  }, []);

  return {
    ...navState,
    setCurrentView,
    setSelectedDoctor,
    toggleMobileMenu,
    handleDoctorClick
  };
}
