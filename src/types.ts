export type Perspective = 'technical' | 'leadership' | 'conversational';
export type Length = 'short' | 'balanced' | 'detailed';
export type DraftKind = 'Technical insight' | 'Fresh angle' | 'Conversation starter';

export interface Draft {
  kind: DraftKind;
  title: string;
  text: string;
  why: string;
}

export interface GenerateInput {
  postText: string;
  perspective: Perspective;
  length: Length;
  context: string;
}

export interface GenerateResult {
  mode: 'live' | 'demo';
  postSummary: string;
  drafts: Draft[];
}

export interface SavedDraft {
  id: string;
  text: string;
  kind: string;
  createdAt: string;
  sourcePreview: string;
}
