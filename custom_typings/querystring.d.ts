 declare module "querystring" {
     function decode(str: string, sep?: string, eq?: string, options?: { maxKeys: number }): string;
     function encode(str: Object, sep?: string, eq?: string): string;
 }
