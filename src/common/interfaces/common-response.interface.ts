export interface CommonResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}
