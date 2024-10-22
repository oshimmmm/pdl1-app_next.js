"use client";

import React, { useState, ChangeEvent } from 'react';
import ResultDisplay from '../components/Layout/ResultDisplay'; // 再利用可能なコンポーネント
import styles from '../style/style.module.css';

interface MatchedContent {
  content: string[];
}

const MainApp: React.FC = () => {
  const [query, setQuery] = useState<string>(''); 
  const [haiResult, setHaiResult] = useState<MatchedContent[] | null>(null); 
  const [shokudoResult, setShokudoResult] = useState<MatchedContent[] | null>(null); 
  const [nyuResult, setNyuResult] = useState<MatchedContent[] | null>(null); 
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // APIリクエストを送信する関数
  const handleSearch = async () => {
    setIsProcessing(true);
    setHaiResult(null);
    setShokudoResult(null);
    setNyuResult(null);

    const promises: Promise<Response>[] = []; // リクエストを保持する配列

    // クエリに応じてPOSTリクエストを送るAPIを選択
    if (query === '22C3') {
      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

      promises.push(fetch('/api/shokudoJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

      promises.push(fetch('/api/nyuJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

    } else if (query === 'SP142' || query === 'SP263') {
      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

      promises.push(fetch('/api/nyuJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

    } else if (query === '28-8') {
      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));

      promises.push(fetch('/api/shokudoJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }));
    }

    try {
      const responses = await Promise.all(promises); // 複数のリクエストを並行して送信
      const data = await Promise.all(responses.map((response) => response.json())); // 全てのレスポンスを取得

      // 各APIレスポンスをセット
      if (data[0]) setHaiResult(data[0].matchedContent);
      if (data[1]) setShokudoResult(data[1].matchedContent);
      if (data[2]) setNyuResult(data[2].matchedContent);
    } catch (error) {
      console.error('APIエラー:', error);
    } finally {
      setIsProcessing(false); // 処理終了
    }
  };

  return (
    <div className={styles.container}>
      <h1>クローン判定</h1>
      <input 
        type="text" 
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        placeholder="クローンを入力してください" 
        className={styles.inputField}
      />
      <button onClick={handleSearch} className={styles.searchButton}>検索</button>

      {isProcessing && <p>解析中...</p>}
      
      {/* 結果を表示 */}
      {haiResult && <ResultDisplay apiResult={haiResult} />}
      {shokudoResult && <ResultDisplay apiResult={shokudoResult} />}
      {nyuResult && <ResultDisplay apiResult={nyuResult} />}
    </div>
  );
};

export default MainApp;
