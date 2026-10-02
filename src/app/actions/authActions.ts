"use server";

import { UserModel } from "@/lib/models/user";

export interface QuotaCheckResult {
  loginQuota: number;
  isLocked: boolean;
  remaining: number;
}

export async function checkUserLoginQuota(userName: string): Promise<QuotaCheckResult> {
  if (!userName || !userName.trim()) {
    return { loginQuota: 0, isLocked: false, remaining: 10 };
  }

  try {
    const quota = await UserModel.getLoginQuota(userName.trim());
    if (quota === null) {
      // User not found in database: return default remaining
      return { loginQuota: 0, isLocked: false, remaining: 10 };
    }

    const count = Number(quota) || 0;
    return {
      loginQuota: count,
      isLocked: count >= 10,
      remaining: Math.max(0, 10 - count),
    };
  } catch (error) {
    console.error("Error in checkUserLoginQuota action:", error);
    return { loginQuota: 0, isLocked: false, remaining: 10 };
  }
}
