import { db } from "@/lib/db";
import type { UserRole } from "@/types/user";

export async function updateUserRole(
  profileId: string,
  role: UserRole
): Promise<void> {
  await db.transact([
    db.tx.userProfile[profileId].update({ role }),
  ]);
}

