export interface AIModel {
  id: string;
  provider: string;
  modelName: string; // 用于传给 Dify
  displayName: string; // 用于前端展示
  isDefault?: boolean;
}

