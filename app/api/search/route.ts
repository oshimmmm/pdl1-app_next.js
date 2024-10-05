import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

interface PdfLink {
  text: string;
  href: string;
  pdfContent?: string; // PDF内容の一部を保持するプロパティを追加
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

    // 'li' 要素ごとに非同期処理を行うために map を使用
    // $('li')で、ページ内の全ての<li>タグを選択。各リンクタグに対して下の処理を実行。
    // indexは要素のインデックス番号でelementは現在のリンクタグ要素
    const liElements = $('li').map(async (index, element) => {
      // 現在のリンクタグ要素のテキストを取得し、.trim()で前後の不要な空白を削除
      const liText = $(element).text().trim();


      if (liText.includes(localResult)) {
        // マッチしたリンクタグ要素の1番近い親の<table>タグ要素を取得
        const table = $(element).closest('table');

        const pdfLinks: PdfLink[] = [];

        // table内の各 'a' 要素ごとに非同期処理を行うために map を使用し、Promise.all で待つ
        const linkPromises = table.find('a').map(async (i, el) => {
          const linkText = $(el).text().trim();
          // aタグのhref属性（リンクURL）を取得。
          const linkHref = new URL($(el).attr('href') ?? '', url).href; // linkHrefがundefinedの場合は空の文字列を使用

          try {
            // PDFデータを取得
            const pdfResponse = await axios.get(linkHref, { responseType: 'arraybuffer' });
            const pdfBuffer = Buffer.from(pdfResponse.data);

            // PDFを解析してテキストを抽出
            const parsedPdf = await pdfParse(pdfBuffer);
            const pdfText = parsedPdf.text;

            // 「対象となる効能又は効果」の部分を探して、その前後のテキストを抽出
            const keyword = '対象となる効能又は効果';
            const nextKeyword = '対象となる用法及び用量';

            const keywordIndex = pdfText.indexOf(keyword);
            const nextKeywordIndex = pdfText.indexOf(nextKeyword);

            let pdfContent = '';

            if (keywordIndex !== -1 && nextKeywordIndex !== -1 && nextKeywordIndex > keywordIndex) {
              pdfContent = pdfText.slice(keywordIndex + keyword.length, nextKeywordIndex);
            } else if (keywordIndex !== -1) {
            // nextKeywordが見つからなかった場合、keyword以降の150文字を抽出
              pdfContent = pdfText.slice(keywordIndex, keywordIndex + 150);
            }

            pdfLinks.push({
              text: linkText,
              href: linkHref,
              pdfContent: pdfContent || '対象の内容が見つかりませんでした', // PDFの内容を追加
            });

          } catch (pdfError) {
            console.error(`PDFの解析中にエラーが発生しました: ${pdfError}`);

          }
        }).get(); // get() で配列に変換

        // すべてのリンクの処理が完了するのを待つ
        await Promise.all(linkPromises);

        matchedContent = {
          title: liText,
          pdfLinks: pdfLinks,
        };
      }
    }).get(); // get() で配列に変換

    // すべての li 要素の処理が完了するのを待つ
    await Promise.all(liElements);

    if (!matchedContent) {
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404 });
    }

    // matchedContentをクライアントに返す
    return NextResponse.json({ matchedContent });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'エラーが発生しました' }, { status: 500 });
  }
}