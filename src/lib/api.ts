import type { 
  User, Group, Tag, JoinRequest, PageResponse 
} from "@/types";

const BASE_URL = "/api";

// Helper to get token
const getToken = () => localStorage.getItem("token");

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event("auth-unauthorized"));
    throw new Error("Unauthorized");
  }

  // Handle No Content
  if (response.status === 204 || response.status === 200) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
         return response.json() as Promise<T>;
      } else {
         return {} as T; 
      }
  }

  if (!response.ok) {
    let message = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) message = errorData.message;
    } catch (e) {
      // Use fallback message
    }
    const err = new Error(message) as any;
    err.status = response.status;
    throw err;
  }

  return {} as T;
}

// ----------------------
// Auth Operations
// ----------------------
export const authApi = {
  login: (data: any) => fetchApi<{token: string, user: User}>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  signup: (data: any) => fetchApi<{token: string, user: User}>("/auth/signup", { method: "POST", body: JSON.stringify(data) })
};

// ----------------------
// User Operations
// ----------------------
export const userApi = {
  getMe: () => fetchApi<User>("/users/me"),
  updateProfile: (data: any) => fetchApi<User>("/users/me", { method: "PUT", body: JSON.stringify(data) })
};

// ----------------------
// Tag Operations
// ----------------------
export const tagsApi = {
  getTags: async () => {
    const res = await fetchApi<any>("/tags");
    if (Array.isArray(res)) return res as Tag[];
    if (res && res.content && Array.isArray(res.content)) return res.content as Tag[];
    return [];
  }
};

// ----------------------
// Util Operations
// ----------------------
export const utilsApi = {
  getYears: () => fetchApi<string[]>("/utils/years")
};

// ----------------------
// Request Operations
// ----------------------
export const requestApi = {
  acceptRequest: (requestId: number) => fetchApi(`/requests/${requestId}/accept`, { method: "POST" }),
  rejectRequest: (requestId: number) => fetchApi(`/requests/${requestId}/reject`, { method: "POST" }),
  getMyRequests: (params?: Record<string, any>) => {
    const q = new URLSearchParams(params).toString();
    return fetchApi<PageResponse<JoinRequest>>(`/requests/my-requests${q ? `?${q}` : ''}`);
  },
  getRequestsForMyGroups: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params).toString();
      return fetchApi<PageResponse<JoinRequest>>(`/requests/for-my-groups${q ? `?${q}` : ''}`);
  }
};

// ----------------------
// Group Operations
// ----------------------
export const groupApi = {
  searchGroups: (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
        } else {
            searchParams.append(key, String(value));
        }
      }
    });
    const qs = searchParams.toString();
    return fetchApi<PageResponse<Group>>(`/groups${qs ? `?${qs}` : ''}`);
  },
  getGroupDetails: (groupId: number) => fetchApi<Group>(`/groups/${groupId}`),
  createGroup: (data: any) => fetchApi<Group>("/groups", { method: "POST", body: JSON.stringify(data) }),
  joinGroup: (groupId: number) => fetchApi<JoinRequest>(`/groups/${groupId}/join`, { method: "POST" }),
  cancelGroup: (groupId: number) => fetchApi(`/groups/${groupId}/cancel`, { method: "PATCH" }),
  leaveGroup: (groupId: number) => fetchApi(`/groups/${groupId}/leave`, { method: "DELETE" }),
  getMyGroups: () => fetchApi<PageResponse<Group>>("/groups/my-groups"),
  getJoinedGroups: () => fetchApi<PageResponse<Group>>("/groups/joined")
};
