import React, { ReactNode } from 'react';

interface IProps {
    header: ReactNode;
    text: ReactNode;
}

export default class TargetCard extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render(): ReactNode {
        return (
            <div>
                {this.props.header}
                <span>{this.props.text}</span>
            </div>
        )
    }
}