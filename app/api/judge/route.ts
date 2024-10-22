import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export interface PdfLink {
  text: string; // PDFリンクの説明テキスト
  href: string; // PDFリンクのURL
  pdfContent?: string; // PDFから抽出した内容（任意）
}

interface MatchedContent {
    content: string[]; // 子要素のテキストを配列として格納
}

export async function POST(req: NextRequest) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { query } = await req.json(); // リクエストボディからqueryとlocalResultを取得

    // HTMLコンテンツの取得と解析を行う
    const { data } = await axios.get('https://www.haigan.gr.jp/publication/guideline/examination/2023/1/2/230102070100.html', {
      params: { q: query }
    });

    const cheerio = await import('cheerio');
    const $ = cheerio.load(data); // cheerioを使ってHTMLをパース
    let matchedContent: MatchedContent[] = []; // 複数のdivを扱えるように配列にする
    
    // class="cq" の div タグのうち、子の p タグに "PD-L1" を含むものを走査
    $('.cq').each((index, element) => {
      const pTagText = $(element).find('p').text().trim();
      
      if (pTagText.includes('PD-L1')) {
        let currentContent = ""; // 現在の内容を保持する変数
        let contentArray: string[] = []; // まとめたテキストを保存する配列
    
        // div の全ての子要素を走査
        $(element).children().each((i, childElement) => {
          // childElement が定義されていることを確認
          if (childElement) {
            const tagName = $(childElement).prop('tagName')?.toLowerCase(); // tagName が undefined でもエラーにならないように ?. を使用
            const childText = $(childElement).text().trim();
    
            if (tagName === 'dd') {
              // dd タグに入ったら、これまでの currentContent をまとめる
              if (currentContent) {
                contentArray.push(currentContent); // これまでの内容を保存
                currentContent = ""; // currentContentをリセット
              }
              currentContent += childText; // dd の内容をまとめる
            } else {
              // dd タグでない場合は currentContent に内容を追加
              currentContent += childText + " ";
            }
          }
        });
    
        // 最後に currentContent に残っている内容を保存
        if (currentContent) {
          contentArray.push(currentContent);
        }
    
        // matchedContent に保存
        matchedContent.push({
          content: contentArray, // まとめたテキストを配列として保存
        });
      }
    });


    if (matchedContent.length > 0) {
      console.log("matchedContent", matchedContent);
      return NextResponse.json({ matchedContent }, { headers }); // 処理結果を返す
    } else {
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404, headers }); // 該当内容が見つからない場合のエラーレスポンス
    }
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500, headers }); // サーバーエラーレスポンス
  }
}