import FileViewDriver from "./FileViewDriver";
import React, { ReactNode } from "react";
import DOMPurify from 'dompurify' 

export default class ImageFileViewDriver extends FileViewDriver {
    public render(): ReactNode {
        return (
            <div>
                <article dangerouslySetInnerHTML=
                    {{__html: DOMPurify.sanitize(`<img src='data:image/jpeg;base64,${this.props.content}'/>`)}}>
                </article>
            </div>
        );
    }
}