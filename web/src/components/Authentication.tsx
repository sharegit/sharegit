import React from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';
import config from '../config';
import Random from '../util/Random';
import API from '../models/API';
import { BaseState } from '../models/BaseComponent';
import comfig from '../config'

interface IState extends BaseState {
    state: string;
}

export interface IProps  extends RouteComponentProps<any> {
    login: () => void;
}

export default class Authentication extends React.Component<IProps, IState>  {
    state: IState= {
        state: this.constructState(),
        cancelToken: API.aquireNewCancelToken()
    }
    constructState(): string {
        return btoa(JSON.stringify({
            t: Random.str(64),
            d: config.isDev
        }));
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
            if(code != undefined && state != undefined) {
                const parsedState = JSON.parse(atob(state));
                if(parsedState.d && !window.location.href.startsWith('http://localhost:44800')) {
                    const uri = `http://localhost:44800/auth?code=${code}&state=${state}`;
                    window.location.replace(uri);
                    window.location.href = uri;
                    console.log('Replacing URL to localhost because this came from development')
                    console.log(uri)
                    console.log(window.location.href)
                } else {
                    if (code != undefined && state != undefined) {
                        console.log("CODE_SATE_OK")
                        const oauthPrevState = localStorage.getItem('oauthState');
                        if (oauthPrevState != undefined && oauthPrevState == state) {
                            console.log("GOING_TO_API")
                            API.auth(code, state, this.state.cancelToken).then((res) =>{
                                succ = true;
                                localStorage.setItem('OAuthJWT', res.token);
                                localStorage.removeItem('oauthState');
                                this.props.login();
                                this.props.history.push('/dashboard');
                            });
                        }
                    }
                }
            }
            if(!succ) {
                localStorage.setItem('oauthState', this.state.state);
                console.log("SETTING_OAUTH_STATE " + this.state.state);
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
                <a href={`https://github.com/login/oauth/authorize?client_id=${config.client_id}&redirect_uri=${config.redirect_uri}&state=${this.state.state}`}>Authenticate with github</a>
            </div>
        )
    }
}