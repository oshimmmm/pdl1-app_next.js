import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { processingResults } from './dataStore';

export interface PdfLink {
  text: string;
  href: string;
  pdfContent?: string;
}

interface MatchedContent {
  title: string;
  pdfLinks: PdfLink[];
}

// バックグラウンドでPDF解析を行う関数
async function processPDFLinks( queryKey: string, pdfLinks: PdfLink[]) {
  for (const link of pdfLinks) {
    try {
      const pdfResponse = await axios.get(link.href, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(pdfResponse.data);
      const parsedPdf = await pdfParse(pdfBuffer);

      const keyword = '対象となる効能又は効果';
      const nextKeyword = '対象となる用法及び用量';
      const keywordIndex = parsedPdf.text.indexOf(keyword);
      const nextKeywordIndex = parsedPdf.text.indexOf(nextKeyword);

      let pdfContent = '';
      if (keywordIndex !== -1 && nextKeywordIndex > keywordIndex) {
        pdfContent = parsedPdf.text.slice(keywordIndex + keyword.length, nextKeywordIndex);
      } else if (keywordIndex !== -1) {
        pdfContent = parsedPdf.text.slice(keywordIndex, keywordIndex + 150);
      }

      link.pdfContent = pdfContent || '内容が見つかりませんでした';
    } catch (error) {
      console.error('PDF解析エラー:', error);
    }
  }
  // 解析完了後、結果をデータストアに保存
  processingResults.set(queryKey, { pdfLinks });
}

export async function POST(req: NextRequest) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { query, localResult } = await req.json();
    const queryKey = `${query}-${localResult}`; // 一意なキーを生成

    // クイックレスポンスのためにHTMLコンテンツの取得と解析のみ行う
    const { data } = await axios.get('https://www.pmda.go.jp/review-services/drug-reviews/review-information/p-drugs/0028.html', {
      params: { q: query },
      timeout: 10000 // タイムアウトの設定
    });

    const $ = cheerio.load(data);
    let matchedContent: MatchedContent = { title: '', pdfLinks: [] };

    // HTML解析を実行し、結果を返す
    const liElements = $('li').map((index, element) => {
      const liText = $(element).text().trim();
      if (liText.includes(localResult)) {
        const table = $(element).closest('table');
        const pdfLinks: PdfLink[] = [];

        table.find('a').each((i, el) => {
          const linkText = $(el).text().trim();
          const linkHref = new URL($(el).attr('href') ?? '', 'https://www.pmda.go.jp').href;
          pdfLinks.push({ text: linkText, href: linkHref });
        });

        matchedContent = { title: liText, pdfLinks };
        console.log("matchedContent", matchedContent);
      }
    }).get();

    await Promise.all(liElements);

    // クイックレスポンスとして解析結果を一旦返す
    if (matchedContent) {

      processingResults.set(queryKey, matchedContent);
      // クライアントに迅速にレスポンスを返す
      // returnをつけて早期にレスポンスを終了させる
      const response = NextResponse.json({ matchedContent }, { headers });

      // その後、バックグラウンドでPDF解析を非同期で実行
      processPDFLinks(queryKey, matchedContent.pdfLinks); // 非同期で処理を進める

      return response; // レスポンスを返す
    } else {
      // マッチする内容がなかった場合、404レスポンスを返す
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404, headers });
    }
  } catch (error) {
    // エラーハンドリング。サーバーエラーを返す
    console.error('サーバーエラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500, headers });
  }
}
