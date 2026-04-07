export interface User {
  userId: number;
  name: string;
  username: string;
  year: "FIRST_YEAR" | "SECOND_YEAR" | "THIRD_YEAR" | "FOURTH_YEAR";
  branch: "CSE" | "AI" | "DS" | "CYS" | "IT" | "ECE" | "ME" | "CE" | "EE";
  instagramId: string | null;
  phoneNumber: string | null;
}

export interface Group {
  groupId: number;
  title: string;
  description: string;
  activityDateTime: string;
  maxMembers: number;
  currentMembers: number;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
  tags: Tag[];
  creator: User;
  createdAt: string;
  isCreator: boolean;
  isMember: boolean;
  hasPendingRequest: boolean;
}

export interface Tag {
  tagId: number;
  name: string;
}

export interface GroupMember {
  memberId: number;
  groupId: number;
  userId: number;
  joinedAt: string;
}

export interface JoinRequest {
  requestId: number;
  groupId: number;
  groupTitle: string;
  requester: User;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  requestedAt: string;
  respondedAt: string | null;
  activityDateTime: string;
}

export interface GroupWithTags extends Group {
  // Alias for Group, since the backend returns tags inherently, we might not even need an intersection anymore
  // But keeping it for component prop compatibilities.
}

export interface CurrentUser {
  token: string;
  user: User;
}

// Pagination generic
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}
