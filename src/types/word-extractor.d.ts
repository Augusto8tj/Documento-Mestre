declare module 'word-extractor' {
  export interface ExtractedWordDocument {
    getBody(): string;
    getHeaders(options?: { includeFooters?: boolean }): string;
    getFooters(): string;
    getFootnotes(): string;
    getEndnotes(): string;
  }

  export default class WordExtractor {
    extract(input: string | Buffer): Promise<ExtractedWordDocument>;
  }
}
