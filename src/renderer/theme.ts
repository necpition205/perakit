import { Theme } from '@emotion/react';

export const theme: Theme = {
  colors: {
    bg: '#ffffff',
    text: '#0f172a',
    border: '#e5e7eb',
    accent: '#6366f1',
  } as any,
};

declare module '@emotion/react' {
  export interface Theme {
    colors: {
      bg: string;
      text: string;
      border: string;
      accent: string;
    };
  }
}

