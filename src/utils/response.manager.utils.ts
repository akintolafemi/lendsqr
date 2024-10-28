import { statusValue } from 'src/types/response.types';

export type standardResponse = {
  status: number;
  statusText: statusValue;
  message: string;
  data?: Array<Record<any, any>> | Record<any, any> | null;
};

export type meta = {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

export class ResponseManager {
  public static standardResponse(response: standardResponse) {
    return response;
  }
}
