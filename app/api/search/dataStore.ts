// データストアを作成（簡易的なメモリ上のストア）
import { PdfLink } from './route';

const processingResults: Map<string, { pdfLinks: PdfLink[] }> = new Map();

export { processingResults };