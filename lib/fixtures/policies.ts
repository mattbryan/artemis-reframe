export interface PolicyFixture {
  id: string;
  name: string;
  rule: string;
  priority?: number;
  createdAt: string;
}

export const policiesFixture: PolicyFixture[] = [
  {
    id: "policy-1",
    name: "Brand Voice Compliance",
    rule: "All copy must use brand voice guidelines.",
    priority: 1,
    createdAt: "2024-01-08T09:00:00Z",
  },
  {
    id: "policy-2",
    name: "No Unverified Claims",
    rule: "Do not make unverified claims about properties.",
    priority: 2,
    createdAt: "2024-01-07T14:00:00Z",
  },
];
