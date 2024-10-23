import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // 指定されたURLからHTMLを取得
    const { data } = await axios.get('https://jbcs.xsrv.jp/guideline/2022/b_index/frq5/');

    // cheerioを使ってHTMLを解析
    const cheerio = await import('cheerio');
    const $ = cheerio.load(data);

    // 最初のimgタグを取得し、そのsrc属性を取得
    const imgSrc = $('img').first().attr('src');
    if (!imgSrc) {
      return NextResponse.json({ message: '画像が見つかりませんでした' }, { status: 404, headers });
    }

    console.log("imgSrc:", imgSrc);

    // 完全なURLに変換
    // const imageUrl = new URL(imgSrc, 'https://jbcs.xsrv.jp').href;

    // 画像URLをレスポンスとして返す
    return NextResponse.json({ matchedContent: imgSrc }, { headers });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500, headers });
  }
}
