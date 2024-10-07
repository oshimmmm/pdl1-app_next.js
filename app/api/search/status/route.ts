// PDF解析が完了しているか確認するAPI
// 解析完了していれば解析済のデータを返す。未完了なら解析中として202ステータス返す。

import { NextRequest, NextResponse } from 'next/server';
import { processingResults } from '../dataStore';

export async function POST(req: NextRequest) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { query, localResult } = await req.json();
    const queryKey = `${query}-${localResult}`;

    if (processingResults.has(queryKey)) {
      const result = processingResults.get(queryKey) as { pdfLinks: { text: string; href: string; pdfContent?: string }[] };
      console.log("result", result);

      // PDF解析が完了しているか確認
      const allParsed = result.pdfLinks.every(link => link.pdfContent !== undefined);

      if (allParsed) {
        // 全てのPDF解析が完了している
        return NextResponse.json({ matchedContent: result }, { headers });
      } else {
        // まだ解析中
        return NextResponse.json({ message: '解析中です' }, { status: 202, headers });
      }
    } else {
      // 該当するデータがない
      return NextResponse.json({ message: 'データが見つかりませんでした' }, { status: 404, headers });
    }
  } catch (error) {
    console.error('ステータスチェック中にエラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500, headers });
  }
}
