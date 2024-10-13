import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export interface PdfLink {
  text: string;
  href: string;
  pdfContent?: string;
}

interface MatchedContent {
  title: string;
  pdfLinks: PdfLink[];
}

// Axiosのリトライ機能を設定
import retryAxios from './retryAxios';
import axiosInstance from 'axios';
retryAxios(axiosInstance, { maxRetryCount: 3, retryDelay: 1000 });

// バックグラウンドでPDF解析を行う関数
async function processPDFLinks(pdfLinks: PdfLink[]) {
  // Promise.allを使用して並列で処理を実行
  await Promise.all(
    pdfLinks.map(async (link) => {
      try {
        const pdfResponse = await axiosInstance.get(link.href, { 
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: {
            'Connection': 'close'  // keep-aliveを無効にする
          }
        });
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
    })
  );
}

export async function POST(req: NextRequest) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { query, localResult } = await req.json();

    // クイックレスポンスのためにHTMLコンテンツの取得と解析を行う
    const { data } = await axiosInstance.get('https://www.pmda.go.jp/review-services/drug-reviews/review-information/p-drugs/0028.html', {
      params: { q: query }
    });

    // cheerioで取得したHTMLを操作できるように。
    const $ = cheerio.load(data);

    let matchedContent: MatchedContent = { title: '', pdfLinks: [] };

    // HTML解析を実行し、結果を返す
    $('li').each((index, element) => {
      const liText = $(element).text().trim();

      // localResultを含む<li>タグを見つけてその親の<table>タグを見つける
      if (liText.includes(localResult)) {
        const table = $(element).closest('table');

        const pdfLinks: PdfLink[] = [];

        table.find('a').each((i, el) => {
          const linkText = $(el).text().trim();
          const linkHref = new URL($(el).attr('href') ?? '', 'https://www.pmda.go.jp').href;
          pdfLinks.push({ text: linkText, href: linkHref });
        });

        matchedContent = { title: liText, pdfLinks };
        
      }
    });

    // PDF解析を同期的に実行し、レスポンスを一度に返す
    if (matchedContent.pdfLinks.length > 0) {
      await processPDFLinks(matchedContent.pdfLinks); // PDF解析を実行
      console.log("matchedContent", matchedContent);

      // 解析結果を含むレスポンスを返す
      return NextResponse.json({ matchedContent }, { headers });
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