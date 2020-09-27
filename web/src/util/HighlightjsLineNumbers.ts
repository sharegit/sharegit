import hljs from 'highlight.js';

declare interface HLJSApiLineNumbers extends HLJSApi {
  initLineNumbersOnLoad: any;
  lineNumbersBlock: any;
  lineNumbersValue: any;
}

declare global {
  interface Window {
    hljs: HLJSApiLineNumbers;
  }
}

const highlight = (hljs as unknown) as HLJSApiLineNumbers;
window.hljs = highlight;
highlight.configure({
  tabReplace: '    ',
});

require('highlightjs-line-numbers.js');

export default highlight;
