/// <reference types="expo-router/types" />

// Module declarations for packages that may lack types
declare module 'expo-router' {
  export const Stack: any;
  export const Tabs: any;
  export const useRouter: () => {
    push: (route: any) => void;
    replace: (route: any) => void;
    back: () => void;
  };
  export const useLocalSearchParams: <T = Record<string, string>>() => T;
  export const usePathname: () => string;
  export const Link: any;
  export const Redirect: any;
}

declare module 'expo-status-bar' {
  export const StatusBar: any;
}

declare module 'expo-constants' {
  const Constants: any;
  export default Constants;
}

declare module 'expo-location' {
  export const requestForegroundPermissionsAsync: () => Promise<any>;
  export const getCurrentPositionAsync: () => Promise<any>;
}

declare module 'react-native-maps' {
  export const MapView: any;
  export const Marker: any;
  export default any;
}

