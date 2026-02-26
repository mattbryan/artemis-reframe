export interface PromptFixture {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  policyId?: string;
}

export const promptsFixture: PromptFixture[] = [
  {
    id: "prompt-1",
    name: "CRE Listing Generator",
    body: "Generate a CRE listing description for the given asset.",
    createdAt: "2024-01-10T12:00:00Z",
    policyId: "policy-1",
  },
  {
    id: "prompt-2",
    name: "Social Media Copy",
    body: "Generate social media copy in brand voice.",
    createdAt: "2024-01-09T10:00:00Z",
  },
];
