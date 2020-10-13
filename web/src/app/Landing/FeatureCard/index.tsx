import React, { ReactNode } from 'react';
import style from './style.scss'
import { Grid } from '@material-ui/core';

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
            <Grid item container alignItems='center' justify='center' direction='row' className={style.featureCard}>
                <Grid item container className={style.icon} justify='center'>
                    {this.props.icon}
                </Grid>
                <Grid item container className={style.content}>
                    <h3>{this.props.header}</h3>
                    <span>{this.props.text}</span>
                </Grid>
            </Grid>
        )
    }
}