import { AxiosInstance, AxiosRequestConfig } from "axios";

interface RetrySetting {
  readonly maxRetryCount: number;
  readonly retryDelay?: number;
}

// axiosInstanceにリトライ機能を付けてretryAxiosを作る
const retryAxios = (
  axiosInstance: AxiosInstance,
  // retryAxiosはmaxRetryCountとretryDelayを引数に受け取る
  { maxRetryCount, retryDelay = 0 }: RetrySetting
): void => {
  // retryCounterMapというMapを作成。
  // Map はキーと値のペアを保存するオブジェクトで、キーはリクエストの URL (PDFのパス) で値はその URL に対しての再試行回数
  const retryCounterMap = new Map<string, number>();

  // axiosInstanceに対してレスポンスのinterceptors(カスタマイズ)を設定
  axiosInstance.interceptors.response.use(
    // レスポンスが正常に返ってきたら再試行カウンタを削除する。PDFのパスがundefined の場合は空文字列 '' をキーにする。
    (response) => {
      retryCounterMap.delete(response.config.url ?? '');
      return response;
    },

    // エラー発生時
    async (error) => {
      // エラーがECONNABORTED（接続が中断された）の場合、
      if (error.code === "ECONNABORTED") {
        // エラーになったPDFパスを再取得。パスが存在しない場合は空文字列。
        const url = error.config.url ?? '';
        // retryCounterMapから現在の試行回数を取得して+1する。カウントが存在しない場合は0として初期化。
        const retryCounter = (retryCounterMap.get(url) || 0) + 1;
        // 試行回数がmaxRetryCountを超えた場合、
        if (retryCounter > maxRetryCount) {
          retryCounterMap.delete(url);
          // エラーを発生させて呼び出し元へエラーを返す
          return Promise.reject(error);
        }
        // 再試行回数を更新してretryCounterMapに保存。
        retryCounterMap.set(url, retryCounter);

        //再試行を行う処理
        return new Promise((resolve, reject) =>
          // retryDelay の時間だけ待機してから、await以降を実行する。
          setTimeout(async () => {
            try {
              // もともとのリクエスト設定 (error.config) を使って再度リクエストを送信。
              const res = await axiosInstance.request(
                error.config as AxiosRequestConfig
              );
              //  リクエストが成功した場合、そのレスポンスを resolve で返す
              resolve(res);
            } catch (e) {
              reject(e); // リクエストが失敗した場合、エラーを reject で返す
            }
          }, retryDelay)
        );
      }
      // if (error.code === "ECONNABORTED") の条件に該当しなかった場合、再試行せずにエラーをそのまま reject で返す。
      return Promise.reject(error);
    }
  );
};

export default retryAxios;
