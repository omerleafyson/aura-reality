export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' | 'unpaid';
  generationsRemaining?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscription?: SubscriptionState;
}

export type Category = 'History' | 'Future' | 'Technology' | 'Society' | 'Business' | 'Science' | 'Space' | 'Personal Scenario' | 'Environment' | 'Politics' | 'Culture';

export type ImpactDirection = 'positive' | 'negative' | 'neutral' | 'transformative';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface ImpactCategory {
  id: string;
  domain: Category;
  level: ImpactLevel;
  direction: ImpactDirection;
  explanation: string;
}

export interface RealityEntity {
  id: string;
  name: string;
  type: 'organization' | 'person' | 'region' | 'technology' | 'concept';
  impactDescription: string;
}

export interface RealityEvent {
  id: string;
  year: string;
  title: string;
  explanation: string;
  impactIndicators: string[];
  forkedFromId?: string; // If this event was the start of a fork
}

export interface RealityBranch {
  id: string;
  sourceEventId: string;
  targetRealityId: string;
}

export interface RealityFork {
  id: string;
  originalEventId: string;
  newPrompt: string;
  resultingRealityId: string;
}

export interface Reality {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  categories: Category[];
  createdAt: string;
  authorId: string;
  timelineRange: string;
  overview: string[];
  events: RealityEvent[];
  impacts: ImpactCategory[];
  entities: RealityEntity[];
  assumptions?: string[];
  uncertainties?: string[];
  forks: RealityFork[];
  branches: RealityBranch[];
  isPublic: boolean;
  visibility?: 'private' | 'unlisted' | 'public';
  views: number;
  forkCount: number;
  savedCount: number;
  isCuratedDemo?: boolean;
  parentRealityId?: string;
  forkSourceEventId?: string;
}

export interface Collection {
  id: string;
  name: string;
  ownerId: string;
  realityIds: string[];
  isPublic: boolean;
}
