import React, { ReactNode } from 'react';
import style from './style.scss'

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
            <div className={style.featureCard}>
                <div className={style.icon}>
                    {this.props.icon}
                </div>
                <div className={style.content}>
                    <h3>{this.props.header}</h3>
                    <span>{this.props.text}</span>
                </div>
            </div>
        )
    }
}