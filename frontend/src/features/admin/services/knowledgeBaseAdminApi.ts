import { apiDelete, apiGet, apiPost, apiPut } from '../../shared/services/api';

export interface KnowledgeBaseAdminItem {
  id: string;
  kbKey: string;
  name: string;
  description?: string;
  apiKey: string;
  apiUrl: string;
  availableUsers?: string;
  canSelectModel: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseRequest {
  kbKey: string;
  name: string;
  description?: string;
  apiKey: string;
  apiUrl: string;
  availableUsers?: string;
  canSelectModel: boolean;
  enabled: boolean;
  sortOrder?: number;
}

export type UpdateKnowledgeBaseRequest = Partial<CreateKnowledgeBaseRequest>;

export async function listKnowledgeBases(): Promise<KnowledgeBaseAdminItem[]> {
  return apiGet('/api/admin/knowledge-bases');
}

export async function getKnowledgeBase(id: string): Promise<KnowledgeBaseAdminItem> {
  return apiGet(`/api/admin/knowledge-bases/${id}`);
}

export async function createKnowledgeBase(body: CreateKnowledgeBaseRequest): Promise<KnowledgeBaseAdminItem> {
  return apiPost('/api/admin/knowledge-bases', body);
}

export async function updateKnowledgeBase(
  id: string,
  body: UpdateKnowledgeBaseRequest,
): Promise<KnowledgeBaseAdminItem> {
  return apiPut(`/api/admin/knowledge-bases/${id}`, body);
}

export async function deleteKnowledgeBase(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/admin/knowledge-bases/${id}`);
}
