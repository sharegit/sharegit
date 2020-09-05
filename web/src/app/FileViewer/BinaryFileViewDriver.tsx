import FileViewDriver from "./FileViewDriver";
import React, { ReactNode } from "react";

export default class BinaryFileViewDriver extends FileViewDriver {
    public render(): ReactNode {
        return (
            <div>
                <p>Binary file, can't be displayed.</p>
                <a download={`${this.props.filename}`} href={`data:application/octet-stream;base64,${this.props.content}`}>Download...</a>
            </div>
        )
    }
}