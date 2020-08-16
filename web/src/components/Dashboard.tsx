import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { BaseState } from '../models/BaseComponent';
import API from '../models/API';


interface IState extends BaseState {
    name: string;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Dashboard extends React.Component<IProps, IState>  {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        name: ''
    }
    constructor(props: IProps) {
        super(props);
    }
    componentDidMount() {
        if (localStorage.getItem('OAuthJWT')) {
            API.fetchDashboardEssential(this.state.cancelToken)
            .then((res) => {
                this.state.name = res.name;
                this.setState(this.state);
            });
        } else {
            this.props.history.push(`/auth`);
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }
    render() {
        return (
            <div>
                <h2>
                    Dashboard
                </h2>
                <p>Hello {this.state.name}</p>
            </div>
        )
    }
}