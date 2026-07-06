import { useState, useCallback, useEffect, useMemo } from 'react';
import { UserType, View } from '../types';

interface NavigationState {
  currentView: View;
  selectedDoctor: number | null;
  mobileMenuOpen: boolean;
}

const patientViews: View[] = [
  'home',
  'messages',
  'treatments',
  'appointments',
  'history',
  'profile',
];
const doctorViews: View[] = [
  'home',
  'messages',
  'patients',
  'appointments',
  'profile',
];

export function getNavigationStorageKey(
  userType: UserType,
  userId: number | null,
) {
  return userType && userId ? `vitalid:last-view:${userType}:${userId}` : null;
}

export function clearNavigationStorage(
  userType: UserType,
  userId: number | null,
) {
  const key = getNavigationStorageKey(userType, userId);
  if (key) localStorage.removeItem(key);
}

export function useNavigation(userType: UserType, userId: number | null) {
  const storageKey = useMemo(
    () => getNavigationStorageKey(userType, userId),
    [userType, userId],
  );
  const allowedViews = userType === 'doctor' ? doctorViews : patientViews;
  const [navState, setNavState] = useState<NavigationState>({
    currentView: getInitialView(storageKey, allowedViews),
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

  useEffect(() => {
    setNavState((prev) => {
      const nextView = allowedViews.includes(prev.currentView)
        ? prev.currentView
        : getInitialView(storageKey, allowedViews);
      return nextView === prev.currentView
        ? prev
        : { ...prev, currentView: nextView, selectedDoctor: null };
    });
  }, [allowedViews, storageKey]);

  useEffect(() => {
    if (!storageKey || !allowedViews.includes(navState.currentView)) return;
    localStorage.setItem(storageKey, navState.currentView);
  }, [allowedViews, navState.currentView, storageKey]);

  return {
    ...navState,
    setCurrentView,
    setSelectedDoctor,
    toggleMobileMenu,
    handleDoctorClick
  };
}

function getInitialView(storageKey: string | null, allowedViews: View[]): View {
  if (!storageKey) return 'home';
  const stored = localStorage.getItem(storageKey) as View | null;
  return stored && allowedViews.includes(stored) ? stored : 'home';
}
