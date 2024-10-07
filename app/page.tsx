"use client"

import React, { useState, ChangeEvent, useEffect } from 'react';
import styles from '../app/style/style.module.css'

// ApiResultの型を修正してmatchedContentを含むように定義
interface PdfLink {
  text: string;
  href: string;
  pdfContent: string;
}

interface MatchedContent {
  pdfLinks: PdfLink[];
}

interface ApiResult {
  matchedContent: MatchedContent | null; // matchedContentが存在する場合、またはnullの場合がある
}

const SearchApp: React.FC = () => {
  // ユーザーが入力したqueryを保存するための状態管理
  const [query, setQuery] = useState<string>(''); // queryの型をstringに指定
  // localResultの入力値を保存して状態管理
  const [localResult, setLocalResult] = useState<string>(''); // localResultの型をstringに指定
  // APIからの結果を保存。初期値はnullでAPIレスポンスがあればMatchedContentが入る。
  const [apiResult, setApiResult] = useState<MatchedContent | null>(null); // apiResultはMatchedContentかnull
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // PDF解析中かどうかのフラグ
  const [pollingActive, setPollingActive] = useState<boolean>(false); // ポーリングが有効かどうか

  const handleSearch = async () => {
    setIsProcessing(true); // 解析中の状態を設定
    setPollingActive(false); // 新しい検索時にはポーリングを無効にする
    setApiResult(null); // 検索結果をリセット

    // 入力されたqueryによってoutputを変える
    let output = '';
    switch (query) {
      case '22C3':
        output = 'ペムブロリズマブ';
        break;
      case '28-8':
        output = 'ニボルマブ';
        break;
      case 'SP263':
      case 'SP142':
        output = 'アテゾリズマブ';
        break;
      default:
        output = '関連する情報が見つかりませんでした';
    }

    // outputの変更を検知して更新
    setLocalResult(output);

    // api/searchにリクエスト（POST）を送信。リクエストボディにはqueryとlocalResult
    const response = await fetch(`/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, localResult: output }),
    });

    // APIから帰ってきたレスポンスを取得
    const data: ApiResult = await response.json(); // レスポンスを型に基づいて取得

    // 初期の検索結果を表示
    setApiResult(data.matchedContent ? data.matchedContent : null);
    setIsProcessing(false); // 解析終了
    setPollingActive(true); // ポーリング開始（詳細解析用）
  };

  // 入力フィールド
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // 型定義されたイベントを使って入力を処理
  };

  // PDF解析が完了しているかどうかを確認するポーリング処理
  useEffect(() => {
    // pollingActiveがtrueの間、定期的に/api/search/statusにリクエストを送信する。
    if (!pollingActive || !apiResult) return;

    // 解析結果を数秒ごとに再確認する
    const interval = setInterval(async () => {
      const response = await fetch(`/api/search/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, localResult }),
      });

      if (response.ok) {
        const data: ApiResult = await response.json();
        if (data.matchedContent) {
          setApiResult(data.matchedContent); // 新しい解析結果を更新
          setPollingActive(false); // ポーリングを停止
        }
      } else if (response.status === 202) {
        // 解析中なので、特に何もしない
      } else {
        console.error('エラーが発生しました:', response.statusText);
        setPollingActive(false); // エラー時はポーリングを停止
      }
    }, 5000);
  
    return () => clearInterval(interval);
  }, [pollingActive, apiResult, query, localResult]);

  return (
    <div className={styles.container}>
      <input 
        type="text" 
        value={query}
        onChange={handleInputChange}
        placeholder="クローンを入力してください" 
        className={styles.inputField}
      />
      <button onClick={handleSearch} className={styles.searchButton}>検索</button>

      <div>
        <h3 className={styles.title}>薬剤：</h3>
        <pre className={styles.result}>{localResult}</pre>
      </div>

      {/* 解析中の状態を表示 */}
      {isProcessing && <p className={styles.processing}>解析中...</p>}

      <div>
        <h3 className={styles.title}>詳細:</h3>
        <div className={styles.resultContainer}>
          {apiResult ? (
            <ul className={styles.resultList}>
              {apiResult.pdfLinks.map((link, index) => (
                <li key={index} className={styles.resultItem}>
                  {/* PDFリンクをクリック可能にする */}
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {link.text}
                  </a>
                  {/* PDFの内容を表示 */}
                  <p className={styles.pdfContent}>{link.pdfContent}</p>
                </li>
              ))}
            </ul>
          ) : (
            <pre className={styles.result}>関連する情報が見つかりませんでした</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchApp;
