import { AxiosInstance, AxiosRequestConfig } from "axios";

interface RetrySetting {
  readonly maxRetryCount: number;
  readonly retryDelay?: number;
}

const retryAxios = (
  axiosInstance: AxiosInstance,
  { maxRetryCount, retryDelay = 0 }: RetrySetting
): void => {
  const retryCounterMap = new Map<string, number>();
  axiosInstance.interceptors.response.use(
    (response) => {
      retryCounterMap.delete(response.config.url ?? '');
      return response;
    },
    async (error) => {
      if (error.code === "ECONNABORTED") {
        const url = error.config.url ?? '';
        const retryCounter = (retryCounterMap.get(url) || 0) + 1;
        if (retryCounter > maxRetryCount) {
          retryCounterMap.delete(url);
          return Promise.reject(error);
        }
        retryCounterMap.set(url, retryCounter);
        return new Promise((resolve, reject) =>
          setTimeout(async () => {
            try {
              const res = await axiosInstance.request(
                error.config as AxiosRequestConfig
              );
              resolve(res);
            } catch (e) {
              reject(e);
            }
          }, retryDelay)
        );
      }
      return Promise.reject(error);
    }
  );
};

export default retryAxios;
