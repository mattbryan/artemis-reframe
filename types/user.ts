export type UserRole = "admin" | "editor";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: number;
  lastSeenAt: number;
}

