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
  const [query, setQuery] = useState<string>(''); // queryの型をstringに指定
  const [localResult, setLocalResult] = useState<string>(''); // localResultの型をstringに指定
  const [apiResult, setApiResult] = useState<MatchedContent | null>(null); // apiResultはMatchedContentかnull

  const handleSearch = async () => {
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

    setLocalResult(output);

    const response = await fetch(`/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, localResult: output }),
    });

    const data: ApiResult = await response.json(); // レスポンスを型に基づいて取得
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
