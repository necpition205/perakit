import { Theme } from '@emotion/react';

export const theme: Theme = {
  colors: {
    bgWeak: '#FFFFFF',
    bgRegular: '#F7F7F8',
    bgStrong: '#E4E4E7',
    bgInverted: '#212126',
    
    divider: '#E9E9EC',
    outline: '#EFEFF1',

    ctWeak: '#B3B3BC',
    ctRegular: '#93939F',
    ctStrong: '#212126',
    ctInverted: '#FFFFFF',
    ctElevated: '#FFFFFF',

    primary: '#000000',
    success: '#0DD31B',
    warning: '#F2B202',
    danger: '#F2542C',
  } as any,
};

declare module '@emotion/react' {
  export interface Theme {
    colors: {
      bgWeak: string;
      bgRegular: string;
      bgStrong: string;
      bgInverted: string;
      
      divider: string;
      outline: string;

      ctWeak: string;
      ctRegular: string;
      ctStrong: string;
      ctInverted: string;
      ctElevated: string;

      primary: string;
      success: string;
      warning: string;
      danger: string;
    };
  }
}

