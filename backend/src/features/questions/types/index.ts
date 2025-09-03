// Question相关类型定义

export interface QuestionItem {
  questionId: number;
  customerName: string;
  siteName: string;
  productType: string;
  module: string;
  description: string;
  createUser: string;
  createTime: string;
  resolvent: string;
  reason: string;
  status: string;
  remark: string;
  repairUserName: string;
  repairDate: string;
  supportUserName: string;
  handleDate: string;
  phrUserName: string;
}

export interface QuestionListResponse {
  questions: QuestionItem[];
  total: number;
}