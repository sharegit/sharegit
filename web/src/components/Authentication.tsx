import React from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';
import config from '../config';
import Random from '../util/Random';
import API, { AuthResult } from '../models/API';
import { BaseState } from '../models/BaseComponent';
import comfig from '../config'
import { Button, Icon, Segment } from 'semantic-ui-react';
import styles from '../styles/Authentication.scss';

interface IState extends BaseState {
    state: string;
    processing: boolean;
}

export interface IProps  extends RouteComponentProps<any> {
    login: () => void;
    provider?: string;
}

export default class Authentication extends React.Component<IProps, IState>  {
    state: IState= {
        state: this.constructState(),
        cancelToken: API.aquireNewCancelToken(),
        processing: false
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
    async componentDidMount() {
        console.log('Provider callback ' + this.props.provider);
        
        let succ = false;
        if(this.props.provider != undefined) {            
            const query = new URLSearchParams(this.props.location.search)
            const code = query.get('code')
            const state = query.get('state')
            
            if(code != undefined && state != undefined) {
                const parsedState = JSON.parse(atob(state));
                if(parsedState.d && !window.location.href.startsWith('http://localhost:44800')) {
                    const uri = `http://localhost:44800/auth/${this.props.provider}?code=${code}&state=${state}`;
                    window.location.replace(uri);
                    window.location.href = uri;
                    console.log('Replacing URL to localhost because this came from development')
                    console.log(uri)
                    console.log(window.location.href)
                } else if (localStorage.getItem('OAuthJWT') == undefined) {
                    if (code != undefined && state != undefined) {
                        console.log("CODE_SATE_OK")
                        const oauthPrevState = localStorage.getItem('oauthState');
                        if (oauthPrevState != undefined && oauthPrevState == state) {
                            console.log("GOING_TO_API")
                            this.state.processing = true;
                            this.setState(this.state);
                            const authResult = await API.authGithub(this.props.provider, code, state, this.state.cancelToken);
                            succ = true;
                            localStorage.setItem('OAuthJWT', authResult.token);
                            localStorage.setItem('OAuthJWT-exp', authResult.exp);
                            localStorage.removeItem('oauthState');
                            this.props.login();
                            this.props.history.push('/dashboard');
                        }
                    }
                } else {
                    this.props.history.push(`/dashboard`);
                }
            } else if(localStorage.getItem('OAuthJWT') != undefined) {
                this.props.history.push(`/dashboard`);
            }
        }

        if(!succ) {
            localStorage.setItem('oauthState', this.state.state);
            console.log("SETTING_OAUTH_STATE " + this.state.state);
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div>
                <Segment className={styles.authSegment}>
                    <h2>
                        Authentication
                    </h2>
                    {
                        this.state.processing ? 
                        <p>Processing authentication request</p>
                    :
                        <div>
                            <Button
                                as='a'
                                primary
                                href={`https://github.com/login/oauth/authorize?client_id=${config.github_auth.client_id}&redirect_uri=${config.github_auth.redirect_uri}&state=${this.state.state}`}>
                                    <Icon name='github'></Icon>
                                    Authenticate with Github
                            </Button>
                            <Button
                            as='a'
                            primary
                            href={`https://gitlab.com/oauth/authorize?client_id=${config.gitlab_auth.client_id}&redirect_uri=${config.gitlab_auth.redirect_uri}&response_type=code&state=${this.state.state}&scope=read_user+read_repository+read_api`}>
                                    <Icon name='gitlab'></Icon>
                                    Authenticate with GitLab
                            </Button>
                            <Button
                            as='a'
                            primary
                            href={`#`}>
                                    <Icon name='bitbucket'></Icon>
                                    Authenticate with Bitbucket
                            </Button>
                        </div>
                    }
                </Segment>
            </div>
        )
    }
}