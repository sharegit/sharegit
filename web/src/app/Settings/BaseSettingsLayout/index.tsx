import React, { ComponentProps } from 'react';
import { BaseState } from 'models/BaseState';
import API from 'models/API';

interface IState extends BaseState {

}
export interface IProps extends ComponentProps<any>  {
    header: string;
    isdangerous?: boolean;
}

export default class BaseSettingsLayout extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken()
        }
    }
    async componentDidMount() {
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div>
                <h3>{this.props.header}</h3>
                {this.props.children}
            </div>
        )
    }
}