"use client";

import React, { useState, ChangeEvent } from 'react';
import ResultDisplay from '../components/Layout/ResultDisplay'; // 再利用可能なコンポーネント
import styles from '../style/style.module.css';
import Image from 'next/image';
import { Card, CardContent, Grid } from "@mui/material";

interface MatchedContent {
  content: string[];
}

interface ResultItem {
  type: string;
  content: MatchedContent[] | string;
}


const MainApp: React.FC = () => {
  const [query, setQuery] = useState<string>(''); 
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // publicディレクトリの静的ファイルからデータを読み込む関数。
  const fetchShokudoResult = async () => {
    try {
      const response = await fetch('/shokudo-info.txt');
      return await response.text();
    }catch (error) {
      console.error('ファイルの読み込みに失敗しました：', error);
    }
  };

  const fetchsikyukeiganResult = async () => {
    try {
      const response = await fetch('/sikyukeigan-info.txt');
      return await response.text();
    }catch (error) {
      console.error('ファイルの読み込みに失敗しました：', error);
    }
  };

  const fetchmelanomaResult = async () => {
    try {
      const response = await fetch('/melanoma-info.txt');
      return await response.text();
    }catch (error) {
      console.error('ファイルの読み込みに失敗しました：', error);
    }
  };
  
  // APIリクエストを送信する関数
  const handleSearch = async () => {
    setIsProcessing(true);
    setResults([]);

    const promises: Promise<any>[] = []; // リクエストを保持する配列

    // クエリに応じてPOSTリクエストを送るAPIを選択
    if (query === '22C3') {
      promises.push(fetchShokudoResult().then(data => ({ type: 'shokudoResult', content: data })));

      promises.push(fetchsikyukeiganResult().then(data => ({ type: 'sikyukeiganResult', content: data })));

      promises.push(fetch('/api/nyuJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).then(res => res.json()).then(data => ({ type: 'nyuResult', content: data.matchedContent })));

      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).then(res => res.json()).then(data => ({ type: 'haiResult', content: data.matchedContent })));


    } else if (query === 'SP142' || query === 'SP263') {
      promises.push(fetch('/api/nyuJudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).then(res => res.json()).then(data => ({ type: 'nyuResult', content: data.matchedContent })));

      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).then(res => res.json()).then(data => ({ type: 'haiResult', content: data.matchedContent })));


    } else if (query === '28-8') {
      promises.push(fetchShokudoResult().then(data => ({ type: 'shokudoResult', content: data })));

      promises.push(fetchmelanomaResult().then(data => ({ type: 'melanomaResult', content: data })));

      promises.push(fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).then(res => res.json()).then(data => ({ type: 'haiResult', content: data.matchedContent })));
    }

    try {
      const fetchedResults = await Promise.all(promises); // 複数のリクエストを並行して送信
      setResults(fetchedResults);
    } catch (error) {
      console.error('APIエラー:', error);
    } finally {
      setIsProcessing(false); // 処理終了
    }
  };

  return (
    <div className={styles.container}>
      <h1 style={{fontWeight: 'bold', margin: '20px 0', fontSize: '24px'}}>PD-L1判定</h1>
      <p>PD-L1の各クローンの判定方法は？<br />
         TPS？CPS？IC？<br />
         どんな患者に何を使うか？<br />
         各癌の診療ガイドラインに記載されている内容です。<br />
      </p>
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
      <Grid container spacing={4} my={2}>
        {results.map((result, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card>
              <CardContent>
                {result.type === 'shokudoResult' && (
                  <div>
                    <h2 style={{ fontWeight: 'bold', backgroundColor: '#f0e68c', padding: '10px', borderRadius: '5px' }}>食道判定</h2>
                    <pre className={styles.preWrapText}>
                      {result.content as string}
                    </pre>
                  </div>
                )}
                {result.type === 'sikyukeiganResult' && (
                  <div>
                    <h2 style={{ fontWeight: 'bold', backgroundColor: '#f0e68c', padding: '10px', borderRadius: '5px' }}>子宮頸癌判定</h2>
                    <pre className={styles.preWrapText}>
                      {result.content as string}
                    </pre>
                  </div>
                )}
                {result.type === 'melanomaResult' && (
                  <div>
                    <h2 style={{ fontWeight: 'bold', backgroundColor: '#f0e68c', padding: '10px', borderRadius: '5px' }}>悪性黒色腫判定</h2>
                    <pre className={styles.preWrapText}>
                      {result.content as string}
                    </pre>
                  </div>
                )}
                {result.type === 'nyuResult' && (
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontWeight: 'bold', backgroundColor: '#f0e68c', padding: '10px', borderRadius: '5px' }}>乳癌判定結果</h3>
                    <a href={result.content as string} target="_blank" rel="noopener noreferrer">
                      <Image 
                        src={result.content as string} 
                        alt="乳癌判定" 
                        layout='responsive'
                        width={500}
                        height={300}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </a>
                  </div>
                )}
                {result.type === 'haiResult' && (
                  <ResultDisplay apiResult={result.content as MatchedContent[]} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      
      
    </div>
  );
};

export default MainApp;
