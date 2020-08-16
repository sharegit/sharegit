import React from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';
import config from '../config';
import Random from '../util/Random';
import API from '../models/API';
import { BaseState } from '../models/BaseComponent';


interface IState extends BaseState {
    random: string;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Authentication extends React.Component<IProps, IState>  {
    state: IState= {
        random: Random.str(64),
        cancelToken: API.aquireNewCancelToken()
    }
    constructor(props: IProps) {
        super(props);
    }
    componentDidMount() {
        if (localStorage.getItem('OAuthJWT')) {
            this.props.history.push(`/dashboard`);
        } else {
            const query = new URLSearchParams(this.props.location.search)
            const code = query.get('code')
            const state = query.get('state')

            let succ = false;
            if (code != undefined && state != undefined) {
                const oauthPrevState = localStorage.getItem('oauthState');
                if (oauthPrevState != undefined && oauthPrevState == state) {
                    API.auth(code, state, this.state.cancelToken).then((res) =>{
                        succ = true;
                        localStorage.setItem('OAuthJWT', res.token);
                        this.props.history.push('/dashboard');
                    });
                }
            }
            if(!succ) {
                localStorage.setItem('oauthState', this.state.random);
            } else {
                localStorage.removeItem('oauthState');
            }
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div>
                <h2>
                    Authentication
                </h2>
                <a href={`https://github.com/login/oauth/authorize?client_id=${config.client_id}&redirect_uri=${config.redirect_uri}&state=${this.state.random}`}>Authenticate with github</a>
            </div>
        )
    }
}