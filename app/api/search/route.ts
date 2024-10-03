import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

interface PdfLink {
  text: string;
  href: string;
}

interface MatchedContent {
  title: string;
  pdfLinks: PdfLink[];
}

// POSTメソッドを作る
export async function POST(req: NextRequest) {
  // await req.json()でリクエストボディを取得。リクエストボディからqueryとlocalResultを抽出
  const { query, localResult }: { query: string; localResult: string } = await req.json();

  const url = 'https://www.pmda.go.jp/review-services/drug-reviews/review-information/p-drugs/0028.html';

  try {
    // urlに対してHTTP GETリクエストを送信し、HTMLコンテンツ取得して{data}へ格納
    const { data } = await axios.get(url, {
      // URLのクエリパラメータとしてqにqueryを設定（無しでも良い）
      params: { q: query }
    });

    // 取得したHTMLデータを解析し$として操作できるようにする
    const $ = cheerio.load(data);
    let matchedContent: MatchedContent | null = null;
    let pdfLinks: PdfLink[] = [];

    // $('li')で、ページ内の全ての<li>タグを選択。.each((index, element) => {@@})で、各リンクタグに対して@を実行。indexは要素のインデックス番号でelementは現在のリンクタグ要素
    $('li').each((index, element) => {
      // 現在のリンクタグ要素のテキストを取得し、.trim()で前後の不要な空白を削除
      const liText = $(element).text().trim();


      if (liText.includes(localResult)) {
        // マッチしたリンクタグ要素の1番近い親の<table>タグ要素を取得
        const table = $(element).closest('table');
        
        const pdfLinks: PdfLink[] = [];
        // テーブルタグ内の全ての<a>タグを選択し、各aタグに対してコールバック関数。elは現在のaタグ
        table.find('a').each((i, el) => {

          // aタグのテキストを取得
          const linkText = $(el).text().trim();
          // aタグのhref属性（リンクURL）を取得
          const linkHref = $(el).attr('href') ?? ''; // linkHrefがundefinedの場合は空の文字列を使用
          // 取得した情報をpdfLinks配列に追加
          pdfLinks.push({ text: linkText, href: linkHref });
        });

        matchedContent = {
          title: liText,
          pdfLinks: pdfLinks
        };
        // マッチが見つかったら終了
        return false;
      }
    });

    if (!matchedContent) {
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404 });
    } else {
      console.log('Matched content:', matchedContent);
    }

    // matchedContentをクライアントに返す
    return NextResponse.json({ matchedContent });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'エラーが発生しました' }, { status: 500 });
  }
}