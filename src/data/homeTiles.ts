import type { RootTabName } from '../navigation/types';

export type HomeTileId = 'watch' | 'community' | 'events' | 'donate';

export type HomeTile = {
  id: HomeTileId;
  title: string;
  description: string;
  kind: 'tab' | 'stack';
  tab?: RootTabName;
  stackScreen?: 'Account';
};

export const homeTiles: HomeTile[] = [
  {
    id: 'watch',
    title: 'Watch',
    description: 'Live & sermons',
    kind: 'tab',
    tab: 'Watch',
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Prayer & groups',
    kind: 'tab',
    tab: 'Community',
  },
  {
    id: 'events',
    title: 'Events',
    description: 'Calendar & outreach',
    kind: 'tab',
    tab: 'Events',
  },
  {
    id: 'donate',
    title: 'Donate',
    description: 'Donate & tithe',
    kind: 'stack',
    stackScreen: 'Account',
  },
];
