import React, { ReactNode } from 'react';

interface IProps {
    header: ReactNode;
    icon: ReactNode;
    text: ReactNode;
}

export default class FeatureCard extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render(): ReactNode {
        return (
            <div>
                <h3>{this.props.header}</h3>
                {this.props.icon}
                <span>{this.props.text}</span>
            </div>
        )
    }
}