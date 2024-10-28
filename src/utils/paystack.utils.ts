import axios from 'axios';
import { PAYSTACK_API_URL } from 'src/constants/paystack.constants';

export const paystackUtil = async (
  endpoint: string,
  method: 'POST' | 'GET',
  data?: any,
  useLiveKey?: boolean,
) => {
  try {
    const response = await axios({
      url: `${PAYSTACK_API_URL}/${endpoint}`,
      method: `${method}`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Authorization: `Bearer ${
          useLiveKey
            ? process.env.PAYSTACK_SECRETE_KEY_LIVE
            : process.env.PAYSTACK_SECRETE_KEY
        }`,
      },
      data,
    });
    return response.data;
  } catch (error) {
    console.log(error?.response);
    return error?.response?.data;
  }
};
