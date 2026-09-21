import type { ImageSourcePropType } from 'react-native';
import type { HeroId } from './types';

/** Bundled hero sprites — keep require() paths stable for Metro. */
export const HERO_ART: Record<HeroId, ImageSourcePropType> = {
  pip: require('../../assets/game/pip.png') as ImageSourcePropType,
  mira: require('../../assets/game/mira.png') as ImageSourcePropType,
  blink: require('../../assets/game/blink.png') as ImageSourcePropType,
  nana: require('../../assets/game/nana.png') as ImageSourcePropType,
};

/** Soft accent rings so race/class still reads at tiny field sizes. */
export const HERO_ACCENT: Record<HeroId, string> = {
  pip: '#4FA8C8',
  mira: '#3E9A4A',
  blink: '#A98BDB',
  nana: '#F0785A',
};
