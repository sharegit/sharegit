import FileViewDriver from "./FileViewDriver";
import React, { ReactNode } from "react";
import marked from 'marked';
import DOMPurify from 'dompurify' 
import highlight from 'util/HighlightjsLineNumbers';
import 'highlight.js/styles/github.css';


marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: (code, language) => {
        console.log(`Highlighting with ${language} of ${code}`)
        const validLanguage = highlight.getLanguage(language) ? language : 'plaintext';
        return highlight.highlight(validLanguage, code).value;
    },
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
});

export default class MDFileViewDriver extends FileViewDriver {
    public render(): ReactNode {
        return (
            <div>
                <article dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(marked(this.props.content))}}></article>
            </div>
        )
    }
}