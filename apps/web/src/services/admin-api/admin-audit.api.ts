import { adminApi } from './admin-axios';

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

export interface AdminAuditPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminAuditResponse {
  items: AdminAuditListItem[];
  pagination: AdminAuditPagination;
}

export interface AdminAuditActorOption {
  id: string;
  username: string;
}

export interface AdminAuditFiltersResponse {
  actions: string[];
  resources: string[];
  actors: AdminAuditActorOption[];
}

export interface AdminAuditQuery {
  search?: string;
  action?: string;
  resource?: string;
  actorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export async function adminGetAuditLogsApi(
  params: AdminAuditQuery,
): Promise<AdminAuditResponse> {
  const { data } = await adminApi.get<AdminAuditResponse>('/admin/audit', {
    params,
  });
  return data;
}

export async function adminGetAuditLogApi(
  id: string,
): Promise<AdminAuditDetails> {
  const { data } = await adminApi.get<AdminAuditDetails>(`/admin/audit/${id}`);
  return data;
}

export async function adminGetAuditFiltersApi(): Promise<AdminAuditFiltersResponse> {
  const { data } = await adminApi.get<AdminAuditFiltersResponse>('/admin/audit/filters');
  return data;
}
