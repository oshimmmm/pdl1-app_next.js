"use client";

import React, { useState, ChangeEvent } from 'react';
import styles from '../app/style/style.module.css';
// import * as Tesseract from 'tesseract.js';

interface PdfLink {
  text: string;
  href: string;
  pdfContent: string;
  hasPDL1?: boolean;
}

interface MatchedContent {
  pdfLinks: PdfLink[];
}

interface ApiResult {
  matchedContent: MatchedContent | null;
  // text?: string;
}

const SearchApp: React.FC = () => {
  // ユーザーが入力したqueryを保存するための状態管理
  const [query, setQuery] = useState<string>(''); // queryの型をstringに指定
  // localResultの入力値を保存して状態管理
  const [localResult, setLocalResult] = useState<string>(''); // localResultの型をstringに指定
  // APIからの結果を保存。初期値はnullでAPIレスポンスがあればMatchedContentが入る。
  const [apiResult, setApiResult] = useState<MatchedContent | null>(null); // apiResultはMatchedContentかnull
  // const [ocrText, setOcrText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // PDF解析中かどうかのフラグ
  const [comUrl, setComUrl] = useState<string | null>(null); // comUrlの初期状態をnullに


  const handleSearch = async () => {
    setIsProcessing(true); // 解析中の状態を設定
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
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, localResult: output }),
    });

    // APIから帰ってきたレスポンスを取得
    const searchData: ApiResult & { comUrl?: string } = await response.json();
    console.log("searchData:", searchData);

    // 初期の検索結果を表示
    setApiResult(searchData.matchedContent ? searchData.matchedContent : null);
    setComUrl(searchData.comUrl ? searchData.comUrl : null);
    setIsProcessing(false); // 解析終了
  };

  // // ocr/route.tsのAPIへPOSTリクエスト(webサイトURLからPDF取得してそれを画像変換して画像を返して)送って、返ってきたレスポンス(PDFから返還された画像データ)をOCR処理する
  // const handleOcr = async () => {
  //   setIsProcessing(true);
  //   setOcrText('');
  
  //   try {
  //     // サーバー側のAPIエンドポイントにウェブサイトのURLを送信
  //     const websiteUrl = 'https://www.pmda.go.jp/review-services/drug-reviews/review-information/cd/0001.html';

  //     const response = await fetch('/api/ocr', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ websiteUrl }), // websiteUrlをサーバーに送信
  //     });

  //     const data: { images: string[] } = await response.json();
  //     console.log("data.images:", data.images);
  
  //     if (data.images && data.images.length > 0) {
  //       // TesseractでOCR処理を行う
  //       const ocrResult = await Tesseract.recognize(data.images[0], 'jpn', {
  //         logger: (m) => console.log(m),
  //       });
  
  //       setOcrText(ocrResult.data.text);
  //     } else {
  //       console.error('画像データがありませんでした');
  //     }
  //   } catch (error) {
  //     console.error('リクエストに失敗しました:', error);
  //   }
  
  //   setIsProcessing(false);
  // };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className={styles.container}>
      <input 
        type="text" 
        value={query}
        onChange={handleInputChange}
        placeholder="PD-L1のクローンを入力してください" 
        className={styles.inputField}
      />
      <button onClick={handleSearch} className={styles.searchButton}>検索</button>
      {/* <button onClick={handleOcr} className={styles.searchButton}>OCR処理</button> */}

      <div>
        <h3 className={styles.title}>薬剤：</h3>
        <pre className={styles.result}>{localResult}</pre>
      </div>

      <div>
        <h3 className={styles.title}>詳細:</h3>
        {/* 解析中の状態を表示 */}
        {isProcessing && <p className={styles.processing}>解析中...</p>}
        <div>
          {comUrl && (
            <div>
              <a href={comUrl} target="_blank" rel="noopener noreferrer" className={styles.comLink}>
                コンパニオンはこちら
              </a>
            </div>
          )}
        </div>
        <div className={styles.resultContainer}>
          {apiResult ? (
            <ul className={styles.resultList}>
              {apiResult.pdfLinks.map((link, index) => (
                <li key={index} className={styles.resultItem}>
                  {/* PDFリンクをクリック可能にする */}
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={link.hasPDL1 ? styles.linkHighlight : styles.link}>
                    {link.text}
                  </a>
                  {/* PDFの内容を表示 */}
                  <p className={styles.pdfContent}>{link.pdfContent}</p>
                </li>
              ))}
            </ul>
          ) : (
            // 解析が終わり、apiResultがnullのままだったら、以下のメッセージ表示
            isProcessing || apiResult === null ? null : <pre className={styles.result}>関連する情報が見つかりませんでした</pre>
          )}
        </div>
      </div>

      {/* <div>
        <h3 className={styles.title}>OCR結果:</h3>
        <pre className={styles.result}>{ocrText}</pre>
      </div> */}
    </div>
  );
};

export default SearchApp;