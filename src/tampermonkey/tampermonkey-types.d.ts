declare function GM_addStyle(css: string): void;
declare function GM_setClipboard(data: string, info?: string): void;
declare function GM_getValue<T>(name: string, defaultValue?: T): T;
declare function GM_setValue(name: string, value: any): void; 