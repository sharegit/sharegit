import FileViewDriver from "./FileViewDriver";
import React, { ReactNode } from "react";
import DOMPurify from 'dompurify'
import highlight from 'highlight.js'
import 'highlight.js/styles/github.css';

export default class SourceFileViewDriver extends FileViewDriver {
    public render(): ReactNode {
        return (
            <div>
                <article dangerouslySetInnerHTML={{__html: this.generateCode()}}></article>
            </div>
        )
    }
    private generateCode() : string {
        console.log('HIGHLIGHT!')
        const validLanguage = highlight.getLanguage(this.props.filetype) ? this.props.filetype : 'plaintext';
        console.log(this.props.content);
        const highlighted = highlight.highlight(validLanguage, this.props.content).value;
        console.log(highlighted);

        const fixed = highlight.fixMarkup(highlighted);
        console.log(fixed);
        const lined = fixed.split('\n').map(x=> {
            return `<tr><td style="white-space: pre">${x}</td></tr>`;
        }).join('');
        const inTable = `<table>${lined}</table>`
        const sanitized = DOMPurify.sanitize(inTable)
        console.log(sanitized);
        return sanitized;
    }
}