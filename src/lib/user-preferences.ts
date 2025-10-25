'use client';

/**
 * User preferences management with localStorage persistence
 * Handles font size, theme, and other user settings
 */

import { clientStorage } from './client-storage';

export interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  displayMode: 'compact' | 'comfortable';
  animations: boolean;
  soundEffects: boolean;
  autoSave: boolean;
}

export interface FontSizeSettings {
  poemText: 'small' | 'medium' | 'large';
  uiText: 'small' | 'medium' | 'large';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: 'medium',
  theme: 'auto',
  displayMode: 'comfortable',
  animations: true,
  soundEffects: false,
  autoSave: true,
};

const STORAGE_KEY = 'ganj_preferences';
const VERSION = '1.0.0';

class UserPreferencesManager {
  private preferences: UserPreferences;
  private listeners: Set<(preferences: UserPreferences) => void> = new Set();

  constructor() {
    this.preferences = this.loadPreferences();
    this.setupStorageListener();
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Update a specific preference
   */
  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): boolean {
    const newPreferences = { ...this.preferences, [key]: value };
    return this.setPreferences(newPreferences);
  }

  /**
   * Set all preferences
   */
  setPreferences(preferences: Partial<UserPreferences>): boolean {
    const newPreferences = { ...this.preferences, ...preferences };
    
    if (clientStorage.set(STORAGE_KEY, newPreferences, { version: VERSION })) {
      this.preferences = newPreferences;
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Reset to default preferences
   */
  resetToDefaults(): boolean {
    return this.setPreferences(DEFAULT_PREFERENCES);
  }

  /**
   * Get font size settings
   */
  getFontSizeSettings(): FontSizeSettings {
    return {
      poemText: this.preferences.fontSize,
      uiText: this.preferences.fontSize,
    };
  }

  /**
   * Get Tailwind classes for font size
   */
  getFontSizeClasses(type: 'poem' | 'ui' = 'poem'): string {
    const fontSize = this.preferences.fontSize;
    
    if (type === 'poem') {
      switch (fontSize) {
        case 'small': return 'text-sm leading-relaxed';
        case 'medium': return 'text-base leading-relaxed';
        case 'large': return 'text-lg leading-relaxed';
        default: return 'text-base leading-relaxed';
      }
    } else {
      switch (fontSize) {
        case 'small': return 'text-xs';
        case 'medium': return 'text-sm';
        case 'large': return 'text-base';
        default: return 'text-sm';
      }
    }
  }

  /**
   * Get theme class for Tailwind
   */
  getThemeClass(): string {
    if (this.preferences.theme === 'auto') {
      return 'dark:bg-stone-900 bg-stone-100';
    }
    return this.preferences.theme === 'dark' ? 'dark' : 'light';
  }

  /**
   * Check if animations are enabled
   */
  shouldAnimate(): boolean {
    return this.preferences.animations;
  }

  /**
   * Check if sound effects are enabled
   */
  shouldPlaySounds(): boolean {
    return this.preferences.soundEffects;
  }

  /**
   * Check if auto-save is enabled
   */
  shouldAutoSave(): boolean {
    return this.preferences.autoSave;
  }

  /**
   * Add a listener for preference changes
   */
  addListener(callback: (preferences: UserPreferences) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): UserPreferences {
    const stored = clientStorage.get<UserPreferences>(STORAGE_KEY, { 
      version: VERSION,
      fallback: DEFAULT_PREFERENCES 
    });
    
    if (stored) {
      // Merge with defaults to handle new properties
      return { ...DEFAULT_PREFERENCES, ...stored };
    }
    
    return DEFAULT_PREFERENCES;
  }

  /**
   * Setup storage listener for cross-tab synchronization
   */
  private setupStorageListener(): void {
    clientStorage.addStorageListener((key, newValue, oldValue) => {
      if (key === STORAGE_KEY && newValue) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...newValue as UserPreferences };
        this.notifyListeners();
      }
    });
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.preferences);
      } catch (error) {
        console.warn('Error in preference listener', error);
      }
    });
  }
}

// Create singleton instance
export const userPreferences = new UserPreferencesManager();

// Export convenience functions
export const getPreferences = () => userPreferences.getPreferences();
export const updatePreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
) => userPreferences.updatePreference(key, value);
export const setPreferences = (preferences: Partial<UserPreferences>) => 
  userPreferences.setPreferences(preferences);
export const resetPreferences = () => userPreferences.resetToDefaults();
export const getFontSizeClasses = (type?: 'poem' | 'ui') => 
  userPreferences.getFontSizeClasses(type);
export const getThemeClass = () => userPreferences.getThemeClass();
export const shouldAnimate = () => userPreferences.shouldAnimate();
export const shouldPlaySounds = () => userPreferences.shouldPlaySounds();
export const shouldAutoSave = () => userPreferences.shouldAutoSave();
export const addPreferenceListener = (callback: (preferences: UserPreferences) => void) => 
  userPreferences.addListener(callback);

// React hooks for components
export const useUserPreferences = () => {
  const [preferences, setPreferences] = React.useState<UserPreferences>(
    userPreferences.getPreferences()
  );

  React.useEffect(() => {
    const unsubscribe = userPreferences.addListener(setPreferences);
    return unsubscribe;
  }, []);

  return preferences;
};

export const useFontSize = () => {
  const preferences = useUserPreferences();
  return {
    fontSize: preferences.fontSize,
    classes: userPreferences.getFontSizeClasses(),
    poemClasses: userPreferences.getFontSizeClasses('poem'),
    uiClasses: userPreferences.getFontSizeClasses('ui'),
  };
};

// Import React for hooks
import React from 'react';
