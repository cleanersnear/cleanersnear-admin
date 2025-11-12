import "server-only";
import { ConnecteamUser, ConnecteamCustomField } from "./types";

const CONNECTEAM_API_BASE = "https://api.connecteam.com";
const CONNECTEAM_PAYROLL_API_KEY = process.env.CONNECTEAM_PAYROLL_API_KEY || "";

if (!CONNECTEAM_PAYROLL_API_KEY) {
  console.warn("⚠️  CONNECTEAM_PAYROLL_API_KEY is not set in environment variables");
}

interface ConnecteamTimeActivity {
  id: number;
  userId: number;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  jobId?: number;
  status: string;
}

// Re-export types for convenience
export type { ConnecteamUser, ConnecteamCustomField };

interface UserTimeActivities {
  userId: number;
  timeActivities: ConnecteamTimeActivity[];
}

interface TimeActivitiesResponse {
  requestId: string;
  data: {
    timeActivitiesByUsers: UserTimeActivities[];
    hasMore?: boolean;
    nextCursor?: string;
  };
}

interface UsersResponse {
  requestId: string;
  data: {
    users: ConnecteamUser[];
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Make authenticated request to Connecteam API
 */
async function connecteamRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CONNECTEAM_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": CONNECTEAM_PAYROLL_API_KEY,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(
        `Connecteam API error (${response.status} ${response.statusText}): ${raw.slice(
          0,
          200,
        )}`,
      );
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(
        `Connecteam API returned non-JSON response: ${raw.slice(0, 200)}`,
      );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get all time clocks
 */
export async function getTimeClocks() {
  const response = await connecteamRequest<{
    requestId: string;
    data: {
      timeClocks: Array<{
        id: number;
        name: string;
        isArchived: boolean;
      }>;
    };
  }>("/time-clock/v1/time-clocks");

  return response.data.timeClocks;
}

/**
 * Get time activities for a specific time clock and date range
 * Returns a flat array of all activities with userId attached
 */
export async function getTimeActivities(
  timeClockId: number,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<ConnecteamTimeActivity[]> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await connecteamRequest<TimeActivitiesResponse>(
    `/time-clock/v1/time-clocks/${timeClockId}/time-activities?${params}`
  );

  // Flatten timeActivitiesByUsers into a single array
  const allActivities: ConnecteamTimeActivity[] = [];
  
  if (response.data.timeActivitiesByUsers && Array.isArray(response.data.timeActivitiesByUsers)) {
    for (const userActivities of response.data.timeActivitiesByUsers) {
      // Check if timeActivities exists and is an array
      if (userActivities.timeActivities && Array.isArray(userActivities.timeActivities)) {
        for (const activity of userActivities.timeActivities) {
          // Ensure userId is set (it should already be, but let's be safe)
          allActivities.push({
            ...activity,
            userId: userActivities.userId,
          });
        }
      }
    }
  }
  
  return allActivities;
}

/**
 * Interface for daily hours breakdown
 */
export interface DailyHoursBreakdown {
  totalHours: number;
  dailyHours: Map<string, number>; // date (YYYY-MM-DD) -> hours
}

/**
 * Get timesheet totals with daily breakdown
 * Returns both total hours and daily hours for each user
 * Reference: https://developer.connecteam.com/reference/get_timesheet_total_hours_time_clock_v1_time_clocks__timeclockid__timesheet_get
 */
export async function getTimesheetTotalsWithDaily(
  timeClockId: number,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<Map<string, DailyHoursBreakdown>> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await connecteamRequest<{
    requestId: string;
    data: {
      startDate: string;
      endDate: string;
      users: Array<{
        userId: number;
        dailyRecords: Array<{
          date: string;
          dailyTotalHours: number;
          dailyTotalWorkHours: number;
          isApproved: boolean;
        }>;
      }>;
    };
  }>(`/time-clock/v1/time-clocks/${timeClockId}/timesheet?${params}`);

  // Create a map of userId -> {totalHours, dailyHours}
  const hoursMap = new Map<string, DailyHoursBreakdown>();
  
  if (response.data.users && Array.isArray(response.data.users)) {
    for (const user of response.data.users) {
      let totalHours = 0;
      const dailyHours = new Map<string, number>();
      
      if (user.dailyRecords && Array.isArray(user.dailyRecords)) {
        for (const day of user.dailyRecords) {
          const hours = day.dailyTotalHours || 0;
          totalHours += hours;
          dailyHours.set(day.date, hours);
        }
      }
      
      hoursMap.set(user.userId.toString(), {
        totalHours,
        dailyHours,
      });
    }
  }

  return hoursMap;
}

/**
 * Get timesheet totals (better for payroll) - Returns pre-calculated hours per user
 * This is the recommended endpoint for payroll processing
 * Reference: https://developer.connecteam.com/reference/get_timesheet_total_hours_time_clock_v1_time_clocks__timeclockid__timesheet_get
 */
export async function getTimesheetTotals(
  timeClockId: number,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
): Promise<Map<string, number>> {
  const hoursMapWithDaily = await getTimesheetTotalsWithDaily(timeClockId, startDate, endDate);
  
  // Convert to simple map of userId -> totalHours
  const hoursMap = new Map<string, number>();
  for (const [userId, breakdown] of hoursMapWithDaily.entries()) {
    hoursMap.set(userId, breakdown.totalHours);
  }
  
  return hoursMap;
}

/**
 * Get all users from Connecteam with pagination support
 * Reference: https://developer.connecteam.com/reference/get_users_users_v1_users_get
 */
export async function getConnecteamUsers(): Promise<ConnecteamUser[]> {
  const allUsers: ConnecteamUser[] = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100; // Max allowed per request

  while (hasMore) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await connecteamRequest<UsersResponse>(
      `/users/v1/users?${params}`
    );

    if (response.data.users) {
      allUsers.push(...response.data.users);
    }

    hasMore = response.data.hasMore || false;
    offset += limit;
  }

  return allUsers;
}

/**
 * Calculate total hours for a user from time activities
 */
export function calculateTotalHours(
  activities: ConnecteamTimeActivity[]
): number {
  const totalSeconds = activities.reduce((sum, activity) => {
    return sum + (activity.duration || 0);
  }, 0);

  return totalSeconds / 3600; // Convert seconds to hours
}

/**
 * Get current week date range (Monday to Sunday)
 * Uses local date components to avoid timezone issues
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // Work with date components to avoid timezone conversion issues
  const year = now.getFullYear();
  const month = now.getMonth();
  const dateNum = now.getDate();
  
  const localDate = new Date(year, month, dateNum);
  const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate offset to Monday
  // Sunday (0) -> -6 days, Monday (1) -> 0 days, Tuesday (2) -> -1 day, etc.
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(year, month, dateNum + daysToMonday);
  const sunday = new Date(year, month, dateNum + daysToMonday + 6);

  // Format as YYYY-MM-DD
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}

