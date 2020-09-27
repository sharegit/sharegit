import FileViewDriver from "./FileViewDriver";
import React, { ReactNode } from "react";
import DOMPurify from 'dompurify' 
import highlight from 'util/HighlightjsLineNumbers';
import 'highlight.js/styles/github.css';
import styles from './style.scss';

export default class SourceFileViewDriver extends FileViewDriver {
    public render(): ReactNode {
        return (
            <div className={styles.tdContainer}>
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
            return `<span style="white-space: pre">${x}</span>`;
        }).join('\n');
        const inTable = `<code class="hljs">${lined}</code>`
        const sanitized = DOMPurify.sanitize(inTable)
        console.log(sanitized);
        return sanitized;
    }
}