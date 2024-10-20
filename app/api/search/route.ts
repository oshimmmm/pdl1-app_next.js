import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

// Axiosのリトライ機能を設定
import retryAxios from './retryAxios';
import axiosInstance from 'axios';
retryAxios(axiosInstance, { maxRetryCount: 3, retryDelay: 1000 });

export interface PdfLink {
  text: string; // PDFリンクの説明テキスト
  href: string; // PDFリンクのURL
  pdfContent?: string; // PDFから抽出した内容（任意）
}

interface MatchedContent {
  title: string; // 一致したコンテンツのタイトル
  pdfLinks: PdfLink[]; // PDFリンクの配列
}

async function processPDFLinks(pdfLinks: PdfLink[]) {
  // Promise.allを使用して並列で処理を実行
  await Promise.all(
    pdfLinks.map(async (link) => {
      try {
        // PDFを取得
        const pdfResponse = await axiosInstance.get(link.href, { 
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: {
            'Connection': 'close'  // keep-aliveを無効にする
          }
        });
        const pdfBuffer = Buffer.from(pdfResponse.data); // PDFデータをバッファに変換
        const parsedPdf = await pdfParse(pdfBuffer); // PDFを解析してテキストを取得

        // キーワードの定義と位置検索
        const keyword = '対象となる効能又は効果';
        const nextKeyword = '対象となる用法及び用量';
        const keywordIndex = parsedPdf.text.indexOf(keyword);
        const nextKeywordIndex = parsedPdf.text.indexOf(nextKeyword);

        let pdfContent = '';
        if (keywordIndex !== -1 && nextKeywordIndex > keywordIndex) {
          // キーワードから次のキーワードまでのテキストを抽出
          pdfContent = parsedPdf.text.slice(keywordIndex + keyword.length, nextKeywordIndex);
        } else if (keywordIndex !== -1) {
          // キーワードが見つかった場合、その周辺のテキストを抽出
          pdfContent = parsedPdf.text.slice(keywordIndex, keywordIndex + 150);
        }

        link.pdfContent = pdfContent || '内容が見つかりませんでした'; // 抽出した内容をリンクに追加
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
    const { query, localResult } = await req.json(); // リクエストボディからqueryとlocalResultを取得

    // HTMLコンテンツの取得と解析を行う
    const { data } = await axios.get('https://www.pmda.go.jp/review-services/drug-reviews/review-information/p-drugs/0028.html', {
      params: { q: query }
    });

    const cheerio = await import('cheerio');
    const $ = cheerio.load(data); // cheerioを使ってHTMLをパース
    let matchedContent: MatchedContent = { title: '', pdfLinks: [] };

    // HTML内のリスト要素を走査
    $('li').each((index, element) => {
      const liText = $(element).text().trim();
      if (liText.includes(localResult)) { // localResultに一致する内容がある場合
        const table = $(element).closest('table'); // リンクを含む最も近い<table>を取得
        const pdfLinks: PdfLink[] = [];
        table.find('a').each((i, el) => {
          const linkText = $(el).text().trim();
          const linkHref = new URL($(el).attr('href') ?? '', 'https://www.pmda.go.jp').href;
          pdfLinks.push({ text: linkText, href: linkHref }); // PDFリンク情報を収集
        });

        matchedContent = { title: liText, pdfLinks }; // 一致した内容をmatchedContentに設定
      }
    });

    // PDFリンクを含むウェブサイトURL
    const websiteUrl = 'https://www.pmda.go.jp/review-services/drug-reviews/review-information/cd/0001.html';

    // 指定されたウェブサイトURLからHTMLデータを取得
    const { data: htmlData } = await axios.get(websiteUrl);
    const com$ = cheerio.load(htmlData);

    // 最初のPDFリンクを取得
    const comPdfLink = com$('a[href$=".pdf"]').first().attr('href');
    if (!comPdfLink) {
      return NextResponse.json({ message: 'PDFファイルが見つかりませんでした' }, { status: 404, headers });
    }

    // comUrlを生成
    const comUrl = new URL(comPdfLink, websiteUrl).href;

    if (matchedContent.pdfLinks.length > 0) {
      await processPDFLinks(matchedContent.pdfLinks); // PDFリンクの内容を処理
      console.log("matchedContent", matchedContent);

      return NextResponse.json({ matchedContent, comUrl }, { headers }); // 処理結果を返す
    } else {
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404, headers }); // 該当内容が見つからない場合のエラーレスポンス
    }
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500, headers }); // サーバーエラーレスポンス
  }
}