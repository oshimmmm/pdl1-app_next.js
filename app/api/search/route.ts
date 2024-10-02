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
  const { query, localResult }: { query: string; localResult: string } = await req.json();

  const url = 'https://www.pmda.go.jp/review-services/drug-reviews/review-information/p-drugs/0028.html';

  try {
    const { data } = await axios.get(url, {
      params: { q: query }
    });

    const $ = cheerio.load(data);
    let matchedContent: MatchedContent | null = null;
    let pdfLinks: PdfLink[] = [];

    $('li').each((index, element) => {
      const liText = $(element).text().trim();
      if (liText.includes(localResult)) {
        const table = $(element).closest('table');
        const pdfLinks: PdfLink[] = [];
        table.find('a').each((i, el) => {
          const linkText = $(el).text().trim();
          const linkHref = $(el).attr('href') ?? ''; // linkHrefがundefinedの場合は空の文字列を使用
          pdfLinks.push({ text: linkText, href: linkHref });
        });

        matchedContent = {
          title: liText,
          pdfLinks: pdfLinks
        };
        return false;
      }
    });

    if (!matchedContent) {
      return NextResponse.json({ message: '該当する内容が見つかりませんでした' }, { status: 404 });
    } else {
      console.log('Matched content:', matchedContent);
    }

    return NextResponse.json({ matchedContent });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'エラーが発生しました' }, { status: 500 });
  }
}