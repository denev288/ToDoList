import axios from 'axios';
import { VITE_APIURL } from '../config';

interface ErrorInfo {
  componentStack?: string;
  message?: string;
  stack?: string;
  [key: string]: any;
}

export const logError = async (error: Error | unknown, additionalInfo?: ErrorInfo) => {
  try {
    const errorObj = error instanceof Error ? error : { message: String(error) };
    const errorInfo = {
      message: errorObj.message,
      stack: (errorObj instanceof Error ? errorObj.stack : undefined),
      additionalInfo
    };

    await axios.post(`${VITE_APIURL}/log-error`, {
      error: errorObj.toString(),
      errorInfo
    });
  } catch (loggingError) {
    // If we can't send the error to the server, at least log it locally
    console.error('Failed to send error to server:', loggingError);
    console.error('Original error:', error);
  }
};
