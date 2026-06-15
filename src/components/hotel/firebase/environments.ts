// src/components/hotel/firebase/environments.ts

/**
 * Anti-casse #11-12-13: environnements dev, staging, production.
 * Trois projets Firebase distincts.
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  firebase: {
    projectId: string;
    apiKey: string;
    authDomain: string;
  };
  api: {
    baseUrl: string;
    socketUrl: string;
  };
  features: {
    useEmulators: boolean;
    verboseLogging: boolean;
    mockLocks: boolean;
  };
}

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    firebase: {
      projectId: 'etherzrp-dev',
      apiKey: process.env.VITE_FIREBASE_API_KEY_DEV ?? '',
      authDomain: 'etherzrp-dev.firebaseapp.com',
    },
    api: {
      baseUrl: 'http://localhost:3001',
      socketUrl: 'http://localhost:3001',
    },
    features: {
      useEmulators: true,
      verboseLogging: true,
      mockLocks: true,
    },
  },
  staging: {
    firebase: {
      projectId: 'etherzrp-staging',
      apiKey: process.env.VITE_FIREBASE_API_KEY_STAGING ?? '',
      authDomain: 'etherzrp-staging.firebaseapp.com',
    },
    api: {
      baseUrl: 'https://staging-api.etherzrp.com',
      socketUrl: 'https://staging-api.etherzrp.com',
    },
    features: {
      useEmulators: false,
      verboseLogging: true,
      mockLocks: true,
    },
  },
  production: {
    firebase: {
      projectId: 'etherzrp-prod',
      apiKey: process.env.VITE_FIREBASE_API_KEY_PROD ?? '',
      authDomain: 'etherzrp.firebaseapp.com',
    },
    api: {
      baseUrl: 'https://api.etherzrp.com',
      socketUrl: 'https://api.etherzrp.com',
    },
    features: {
      useEmulators: false,
      verboseLogging: false,
      mockLocks: false,
    },
  },
};

export function getEnvironment(): Environment {
  const env = (import.meta.env.VITE_ENV as Environment) ?? 'development';
  if (!configs[env]) return 'development';
  return env;
}

export function getConfig(): EnvironmentConfig {
  return configs[getEnvironment()];
}