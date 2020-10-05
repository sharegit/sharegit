import React from 'react'
import FileViewDriver from './FileViewDriver';
import SourceFileViewDriver from './SourceFileViewDriver';
import MDFileViewDriver from './MDFileViewDriver';
import BinaryFileViewDriver from './BinaryFileViewDriver';
import ImageFileViewDriver from './ImageFileViewDriver';
import highlight from 'util/HighlightjsLineNumbers';

interface IState {
    fileType: string;
    fileName: string;
    viewDriver?: FileViewDriver;
    needLineNumbers: boolean;
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
        viewDriver: undefined,
        needLineNumbers: false
    }
    constructor(props: IProps) {
        super(props);
        this.state.fileName = props.displayed.file.substring(props.displayed.file.lastIndexOf('/') + 1, props.displayed.file.length);
        const extensionPosition = this.state.fileName.lastIndexOf('.');
        if(extensionPosition >= 0 && extensionPosition < this.state.fileName.length - 1) {
            this.state.fileType = this.state.fileName.substring(extensionPosition + 1, this.state.fileName.length);
        }
        console.log(this.props.displayed.content)

        switch(this.state.fileType.toLowerCase()) {
            case 'md':
                console.log('Creating MD driver');
                this.state.viewDriver = new MDFileViewDriver({
                    filename: this.state.fileName,
                    filetype: this.state.fileType,
                    content: this.b64DecodeUnicode(this.props.displayed.content)
                });
                break;
            case 'png':
            case 'jpg':
            case 'gif':
                console.log('Creating Image driver')
                this.state.viewDriver = new ImageFileViewDriver({
                    filename: this.state.fileName,
                    filetype: this.state.fileType,
                    content: this.props.displayed.content
                });
                break;
            case '':
            case 'exe':
            case 'dll':
            case 'pdb':
            case 'psd':
                console.log('Creating Binary driver')
                this.state.viewDriver = new BinaryFileViewDriver({
                    filename: this.state.fileName,
                    filetype: this.state.fileType,
                    content: this.props.displayed.content
                });
                break;
            case 'txt':
            default:
                console.log('Creating Text driver')
                this.state.viewDriver = new SourceFileViewDriver({
                    filename: this.state.fileName,
                    filetype: this.state.fileType,
                    content: this.b64DecodeUnicode(this.props.displayed.content),
                });
                this.state.needLineNumbers = true;
                break;
        }
    }
    b64DecodeUnicode(str: string) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        try {
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (ex) {
            return str
        }
    }
    componentDidMount() {
        if(this.state.needLineNumbers) {
            highlight.initLineNumbersOnLoad();
        }
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
                    {this.renderContents()}
                </div>
            </div>
        )
    }
}