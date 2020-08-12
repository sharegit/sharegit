import React from 'react'

interface IState {
}

interface IProps {
    displayed : DisplayedFile
}

export interface DisplayedFile {
    file: string;
    content: string;
}

export default class FileViewer extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    componentDidMount() {
    }
    componentWillUnmount() {
    }

    render() {
        return (
            <div>
                <div>
                    <span>{this.props.displayed.file}</span>
                </div>
                <div>
                    <span>{atob(this.props.displayed.content)}</span>
                </div>
            </div>
        )
    }
}