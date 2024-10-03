"use client"

import React, { useState, ChangeEvent } from 'react';

// ApiResultの型を修正してmatchedContentを含むように定義
interface PdfLink {
  text: string;
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

  const handleSearch = async () => {
    // handleSearchの前半
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
    // APIレスポンス（data）にmatchedContentがあればその内容をapiResultにセット
    setApiResult(data.matchedContent ? data.matchedContent : null); // 型をチェックしてapiResultにセット
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value); // 型定義されたイベントを使って入力を処理
  };

  return (
    <div>
      <input 
        type="text" 
        value={query}
        onChange={handleInputChange}
        placeholder="クローンを入力してください" 
      />
      <button onClick={handleSearch}>検索</button>
      <div>
        <h3>薬剤：</h3>
        <pre>{localResult}</pre>
      </div>

      <div>
        <h3>詳細:</h3>
        <div>
          {apiResult ? (
            <ul>
              {apiResult.pdfLinks.map((link, index) => (
                <li key={index}>{link.text}</li>
              ))}
            </ul>
          ) : (
            <pre>関連する情報が見つかりませんでした</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchApp;
