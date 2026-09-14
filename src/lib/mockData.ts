import { Reality } from '../types';

export const mockMarsReality: Reality = {
  id: 'mars-1999',
  title: 'What if humans landed on Mars in 1999?',
  prompt: 'What if humans landed on Mars in 1999?',
  summary: 'A successful late-90s crewed mission to Mars drastically alters global geopolitics, accelerating aerospace technology by decades and turning the red planet into a new frontier for international competition and commercial expansion.',
  categories: ['Space', 'Technology', 'History'],
  createdAt: new Date().toISOString(),
  authorId: 'system',
  isCuratedDemo: true,
  timelineRange: '1999 - 2032',
  overview: [
    'Mars becomes the center of a new space race between the US, Europe, and China.',
    'Global aerospace investment accelerates by decades, pulling talent from software into hardware.',
    'Permanent orbital infrastructure expands rapidly to support Mars logistics.',
    'The geopolitical balance changes as nations form new blocs based on off-world resource treaties.',
    'Consumer technology receives massive spillover innovation, particularly in life support, materials, and closed-loop ecosystems.'
  ],
  events: [
    {
      id: 'evt_1',
      year: '1999',
      title: 'First crewed Mars landing succeeds',
      explanation: 'The Ares 1 mission touches down in the Chryse Planitia region. Commander Harris delivers the first broadcast from the surface.',
      impactIndicators: ['Global unity surge', 'Aerospace funding spiked'],
    },
    {
      id: 'evt_2',
      year: '2001',
      title: 'Multinational Mars Base Program announced',
      explanation: 'Following the safe return of the Ares 1 crew, a consortium of 14 nations pledges $500B over ten years to establish a permanent presence.',
      impactIndicators: ['Geopolitical realignment'],
    },
    {
      id: 'evt_3',
      year: '2005',
      title: 'Reusable heavy-lift launch systems mature',
      explanation: 'Driven by the need for cheap logistics, reusable rockets become operational 15 years ahead of our timeline, dropping launch costs by 90%.',
      impactIndicators: ['Launch cost plummet', 'Orbital boom'],
    },
    {
      id: 'evt_4',
      year: '2010',
      title: 'First semi-permanent Mars research settlement',
      explanation: 'Base Aldrin is established with a rotating crew of 24 scientists, focused on resource extraction and long-term habitation studies.',
      impactIndicators: ['Continuous habitation achieved'],
    },
    {
      id: 'evt_5',
      year: '2016',
      title: 'Private Mars logistics industry emerges',
      explanation: 'Commercial entities begin bidding for cargo runs to Mars, sparking a trillion-dollar new industry.',
      impactIndicators: ['Commercial space boom'],
    },
    {
      id: 'evt_6',
      year: '2024',
      title: 'Mars population passes 1,000',
      explanation: 'The settlement transitions from purely scientific outpost to a mixed-use colony with permanent residents and civilian industries.',
      impactIndicators: ['Population milestone'],
    },
    {
      id: 'evt_7',
      year: '2032',
      title: 'Permanent civilian settlement begins',
      explanation: 'The first children are born on Mars, and the first fully independent governance charter is drafted for the Martian colonies.',
      impactIndicators: ['Sovereignty debates begin'],
    }
  ],
  impacts: [
    {
      id: 'imp_1',
      domain: 'Technology',
      level: 'extreme',
      direction: 'transformative',
      explanation: 'Aerospace tech accelerates by 30 years. Software boom is slightly muted as top talent focuses on physical engineering and robotics.'
    },
    {
      id: 'imp_2',
      domain: 'Business',
      level: 'high',
      direction: 'positive',
      explanation: 'Creation of a massive off-world logistics and manufacturing sector, injecting trillions into global heavy industry.'
    },
    {
      id: 'imp_3',
      domain: 'Politics',
      level: 'high',
      direction: 'neutral',
      explanation: 'Cold War tensions are sublimated into a cooperative but highly competitive race to claim Martian territory and resources.'
    },
    {
      id: 'imp_4',
      domain: 'Culture',
      level: 'medium',
      direction: 'transformative',
      explanation: 'Humanity shifts to an outward-looking perspective. "The Frontier" becomes the dominant cultural motif of the 21st century.'
    }
  ],
  entities: [
    { id: 'ent_1', name: 'NASA', type: 'organization', impactDescription: 'Budget permanently quadrupled; becomes the premier global logistics coordinator.' },
    { id: 'ent_2', name: 'Space Industry', type: 'technology', impactDescription: 'Grows to rival the size of the global automotive sector by 2020.' },
    { id: 'ent_3', name: 'United States', type: 'region', impactDescription: 'Maintains undisputed technological hegemony through control of early launch infrastructure.' },
    { id: 'ent_4', name: 'Private Aerospace', type: 'organization', impactDescription: 'Takes over Earth-to-Orbit operations entirely by 2010 to free up government agencies for deep space.' }
  ],
  forks: [],
  branches: [],
  isPublic: true,
  views: 1245000,
  forkCount: 4520,
  savedCount: 18000
};

export const mockRealities: Reality[] = [
  mockMarsReality,
  {
    ...mockMarsReality,
    id: 'no-smartphones',
    title: 'What if smartphones never existed?',
    categories: ['Technology', 'Society'],
    views: 890000,
    summary: 'Personal computing remains desktop-bound, while mobile communication focuses on voice and basic text, leading to a drastically different social landscape.',
  },
  {
    ...mockMarsReality,
    id: 'roman-empire-survived',
    title: 'What if the Roman Empire survived?',
    categories: ['History'],
    views: 2100000,
    summary: 'A continuous Roman state navigates the industrial revolution in the 1800s, maintaining a Mediterranean-centric global superpower into the modern era.',
  },
  {
    ...mockMarsReality,
    id: 'electric-cars-2005',
    title: 'What if electric cars dominated by 2005?',
    categories: ['Technology', 'Business'],
    views: 560000,
    summary: 'Early breakthroughs in battery tech lead to the rapid phase-out of internal combustion engines, reshaping global oil politics earlier.',
  }
];

export const mockUser = {
  id: 'usr_123',
  name: 'Explorer',
  email: 'explorer@aurareality.ai',
  subscription: {
    tier: 'free',
    status: 'active',
    generationsRemaining: 3
  }
};
