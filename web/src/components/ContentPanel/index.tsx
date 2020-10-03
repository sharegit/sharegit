import React, { ComponentProps } from 'react';
import style from './style.scss';
import { Grid } from '@material-ui/core';

interface IProps extends ComponentProps<any>, React.HTMLAttributes<HTMLDivElement> {
    background: 'light' | 'dark' | 'gradient';
    direction?: 'row' | 'column';
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
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
            <Grid item container
                direction={this.props.direction == undefined ? 'row' : this.props.direction}
                justify={this.props.justify == undefined ? 'center' : this.props.justify}
                alignItems={this.props.alignItems == undefined ? 'center' : this.props.alignItems}
                id={this.props.id}
                className={`${style.contentPanel}
                            ${this.getBackgroundStyle()}
                            ${this.props.className == undefined ? '' : this.props.className}
                            justify-content-md-center`}>
                {this.props.children}
            </Grid>
        )
    }
}
