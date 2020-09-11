import React, { ComponentProps } from 'react';
import style from './style.scss';
import { Row } from 'react-bootstrap'

interface IProps extends ComponentProps<any>, React.HTMLAttributes<HTMLDivElement> {
    background: 'light' | 'dark' | 'gradient';
}

interface IState {
}

export default class ContentPanel extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    getBackgroundStyle(): string {
        switch(this.props.background) {
            case 'light':
                return style.light;
            case 'dark':
                return style.dark;
            case 'gradient':
                return style.gradient;
        }
    }
    render() {
        return (
            <Row
                id={this.props.id}
                className={`${style.contentPanel}
                            ${this.getBackgroundStyle()}
                            ${this.props.className == undefined ? '' : this.props.className}
                            justify-content-md-center`}>
                {this.props.children}
            </Row>
        )
    }
}