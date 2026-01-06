import type { ImageSourcePropType } from 'react-native';

export type DirectoryMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  photo?: ImageSourcePropType;
};

// Placeholder directory data (replace with API/backend later)
export const churchDirectory: DirectoryMember[] = [
  {
    id: 'm-001',
    name: 'Moriah Member',
    role: 'Member',
    email: 'member@moriahfaithconnect.org',
    phone: '+1 (555) 010-1001',
    address: '123 Church St, Your City, ST 00000',
  },
  {
    id: 'm-002',
    name: 'Pastor James Carter',
    role: 'Senior Pastor',
    email: 'pastor.carter@moriahfaithconnect.org',
    phone: '+1 (555) 010-1002',
    address: 'Mount Moriah M.B. Church, Your City, ST',
  },
  {
    id: 'm-003',
    name: 'Sister Alicia Moore',
    role: 'Youth Coordinator',
    email: 'alicia.moore@moriahfaithconnect.org',
    phone: '+1 (555) 010-1003',
    address: 'Mount Moriah M.B. Church, Your City, ST',
  },
  {
    id: 'm-004',
    name: 'Brother Marcus Reed',
    role: 'Music Ministry',
    email: 'marcus.reed@moriahfaithconnect.org',
    phone: '+1 (555) 010-1004',
    address: 'Mount Moriah M.B. Church, Your City, ST',
  },
  {
    id: 'm-005',
    name: 'Deacon Evelyn Price',
    role: 'Deacon',
    email: 'evelyn.price@moriahfaithconnect.org',
    phone: '+1 (555) 010-1005',
    address: 'Mount Moriah M.B. Church, Your City, ST',
  },
];
