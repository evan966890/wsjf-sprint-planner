/**
 * mammoth/mammoth.browser 类型声明
 */
declare module 'mammoth/mammoth.browser' {
  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer;
  }

  export interface ConvertResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertResult>;
  export function extractRawText(options: ConvertOptions): Promise<ConvertResult>;
  export function convertToMarkdown(options: ConvertOptions): Promise<ConvertResult>;

  const mammoth: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
    convertToMarkdown: typeof convertToMarkdown;
  };

  export default mammoth;
}
