import React from 'react'
import FileViewDriver from './FileViewDriver';
import SourceFileViewDriver from './SourceFileViewDriver';
import MDFileViewDriver from './MDFileViewDriver';

interface IState {
    fileType: string;
    fileName: string;
    viewDriver?: FileViewDriver;
}

interface IProps {
    displayed : DisplayedFile
}

export interface DisplayedFile {
    file: string;
    content: string;
}

export default class FileViewer extends React.Component<IProps, IState> {
    state : IState = {
        fileType: '',
        fileName: '',
        viewDriver: undefined
    }
    constructor(props: IProps) {
        super(props);
        this.state.fileName = props.displayed.file.substring(props.displayed.file.lastIndexOf('/') + 1, props.displayed.file.length);
        const extensionPosition = this.state.fileName.lastIndexOf('.');
        if(extensionPosition >= 0 && extensionPosition < this.state.fileName.length - 1) {
            this.state.fileType = this.state.fileName.substring(extensionPosition + 1, this.state.fileName.length);
        }
        const params = {
            filetype: this.state.fileType,
            // TODO check encoding, it's not always base64!
            content: this.b64DecodeUnicode(this.props.displayed.content)
        }
        switch(this.state.fileType.toLowerCase()) {
            case 'md':
                console.log('Creating MD driver');
                this.state.viewDriver = new MDFileViewDriver(params);
                break;
            case 'txt':
            default:
                this.state.viewDriver = new SourceFileViewDriver(params);
                break;
        }
    }
    b64DecodeUnicode(str: string) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
    componentDidMount() {
    }
    componentWillUnmount() {
    }

    renderContents() {
        if(this.props.displayed.content != undefined
            && this.props.displayed.content != null
            && this.props.displayed.content != ''
            && this.state.viewDriver != undefined) {
            return this.state.viewDriver.render();
        } else {
            return null;
        }
    }
    render() {
        return (
            <div>
                <div>
                    <span>{this.state.fileName}</span>
                </div>
                <div>
                    {this.renderContents()}
                </div>
            </div>
        )
    }
}