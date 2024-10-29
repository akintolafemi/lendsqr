import axios from 'axios';
import { ADJUTOR_API_URL } from 'src/constants/adjustor.constants';

export const adjustorUtil = async (
  endpoint: string,
  method: 'POST' | 'GET',
  data?: any,
) => {
  try {
    const response = await axios({
      url: `${ADJUTOR_API_URL}/${endpoint}`,
      method: `${method}`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Authorization: `Bearer ${process.env.ADJUTOR_API_KEY}`,
      },
      data,
    });
    return response.data;
  } catch (error) {
    return error?.response?.data;
  }
};
