import React, { ReactNode } from 'react';
import style from './style.scss';

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
            <div className={style.target}>
                <div className={style.header}>
                    {this.props.header}
                </div>
                <div className={style.text}>
                    <span>{this.props.text}</span>
                </div>
            </div>
        )
    }
}