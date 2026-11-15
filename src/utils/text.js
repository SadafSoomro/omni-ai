// Format interface text with named values while keeping the UI in English.
export function t(text,values={}){return String(text ?? '').replace(/\{(\w+)\}/g,(match,key)=>values[key]??match);}
