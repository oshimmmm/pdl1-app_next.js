// webサイト内のPDF見つけてそれを画像化するAPI

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createCanvas } from 'canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import path from 'path';

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'public/pdf.worker.js');

export async function POST(req: NextRequest) {
  try {
    const { websiteUrl } = await req.json();

    if (!websiteUrl) {
      return NextResponse.json({ message: 'ウェブサイトのURLが指定されていません' }, { status: 400 });
    }

    // 指定されたウェブサイトURLからPDFのリンクを一つ取得
    const { data: htmlData } = await axios.get(websiteUrl);
    const $ = cheerio.load(htmlData);
    const pdfLink = $('a[href$=".pdf"]').first().attr('href');

    if (!pdfLink) {
      return NextResponse.json({ message: 'PDFファイルが見つかりませんでした' }, { status: 404 });
    }

    const pdfUrl = new URL(pdfLink, websiteUrl).href;

    // PDFをダウンロードし、画像化する
    const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfData = new Uint8Array(pdfResponse.data);

    // ここでPDFの各ページを画像化する（例として最初のページのみ画像化）
    const imageBuffers = await extractFirstPageAsImage(pdfData);

    if (!imageBuffers) {
      return NextResponse.json({ message: '画像化に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ images: imageBuffers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'エラーが発生しました' }, { status: 500 });
  }
}

async function extractFirstPageAsImage(pdfData: Uint8Array): Promise<string[]> {
  const images: string[] = [];

  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1); // 最初のページを取得
    const viewport = page.getViewport({ scale: 2.0 });

    // キャンバスを作成
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // ページをレンダリング
    await page.render(renderContext).promise;

    // 画像データをBase64形式に変換して配列に追加
    images.push(canvas.toDataURL());
  } catch (error) {
    console.error('画像化中にエラーが発生しました:', error);
  }

  return images;
}
