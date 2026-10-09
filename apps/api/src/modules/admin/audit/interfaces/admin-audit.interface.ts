export interface AdminAuditListItem {
  id: string;
  actorId: string | null;
  actorType: string;
  actorName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string;
  status: string;
  createdAt: string;
}

export interface AdminAuditDetails extends AdminAuditListItem {
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AdminAuditResponse {
  items: AdminAuditListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminAuditFiltersResponse {
  actions: string[];
  resources: string[];
  actors: Array<{
    id: string;
    username: string;
  }>;
}

export interface CreateAuditEntryInput {
  actorId?: string | null;
  actorType?: string;
  actorName?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  description: string;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILED';
}
