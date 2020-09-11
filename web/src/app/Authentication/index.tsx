import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Button, Icon, Segment } from 'semantic-ui-react';
import config from 'config';
import API from 'models/API';
import { BaseState } from 'models/BaseState';
import Random from 'util/Random';
import styles from './style.scss';
import GithubMark from 'assets/icons/github-mark-dark.png'
import GitlabMark from 'assets/icons/gitlab-mark.png'
import BitbucketMark from 'assets/icons/bitbucket-mark.svg'
import CustomIcon from 'components/CustomIcon';

interface IState extends BaseState {
    state: string;
    processing: boolean;
    failed: boolean;
    mode: 'signin' | 'signup' | 'add';
}

export interface IProps  extends RouteComponentProps<any>, React.HTMLAttributes<HTMLDivElement> {
    login?: () => void;
    provider?: string;
    mode: 'signin' | 'signup' | 'add';
}

export default class Authentication extends React.Component<IProps, IState>  {
    constructState(): string {
        const query = new URLSearchParams(this.props.location.search)
        return btoa(JSON.stringify({
            t: Random.str(64),
            d: config.isDev,
            m: this.props.mode,
            r: query.get('redirect'),
            addToAccount: false
        }));
    }
    constructor(props: IProps) {
        super(props);
        this.state = {
            state: this.constructState(),
            mode: this.props.mode,
            cancelToken: API.aquireNewCancelToken(),
            processing: false,
            failed: false,
        }
    }
    async componentDidMount() {
        console.log('Provider callback ' + this.props.provider);
        
        let succ = false;
        if(this.props.provider != undefined) {            
            const query = new URLSearchParams(this.props.location.search)
            const code = query.get('code')
            const state = query.get('state')
            const setup_action = query.get('setup_action');
            
            if(code != undefined && state != undefined) {
                const parsedState = JSON.parse(atob(state));
                const redirect = parsedState.r;
                this.setState({mode: parsedState.m});
                if(parsedState.d && !window.location.href.startsWith('http://localhost:44800')) {
                    const uri = `http://localhost:44800/auth/${this.props.provider}?code=${code}&state=${state}`;
                    window.location.replace(uri);
                    window.location.href = uri;
                    console.log('Replacing URL to localhost because this came from development')
                    console.log(uri)
                    console.log(window.location.href)
                } else if (localStorage.getItem('OAuthJWT') == undefined || parsedState.m == 'add') {
                    if (code != undefined && state != undefined) {
                        console.log("CODE_SATE_OK")
                        const oauthPrevState = localStorage.getItem('oauthState');
                        if (oauthPrevState != undefined && oauthPrevState == state) {
                            console.log("GOING_TO_API")
                            this.setState({processing: true});
                            
                            localStorage.removeItem('oauthState');

                            switch(parsedState.m) {
                                case 'signup':
                                    try {
                                        const signUpResult = await API.signUp(this.props.provider, code, state, this.state.cancelToken);
                                        succ = true;
                                        localStorage.setItem('OAuthJWT', signUpResult.token);
                                        if(this.props.login != undefined)
                                            this.props.login();
                                        if(redirect != undefined)
                                            this.props.history.push(redirect);
                                        else
                                            this.props.history.push('/settings');
                                    } catch (e) {
                                        this.setState({processing: false, failed: true});
                                        if (!API.wasCancelled(e)) {
                                            throw e;
                                        }
                                    }
                                    break;
                                case 'signin':
                                case 'add':
                                    try {
                                        const signInResult = await API.signIn(this.props.provider, code, state, this.state.cancelToken);
                                        succ = true;
                                        localStorage.setItem('OAuthJWT', signInResult.token);
                                        if(this.props.login != undefined)
                                            this.props.login();
                                        if (redirect != undefined)
                                            this.props.history.push(redirect)
                                        else if (parsedState.m == 'add') {
                                            this.props.history.push(`/settings/${this.props.provider}`);
                                        } else {
                                            this.props.history.push('/dashboard');
                                        }
                                    } catch (e) {
                                        this.setState({processing: false, failed: true});
                                        if (!API.wasCancelled(e)) {
                                            throw e;
                                        }
                                    }
                                    break;
                            }
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
    getAuthText(): string {
        switch (this.state.mode) {
            case 'signin':
                return 'Sign in';
            case 'signup':
                return 'Sign up';
            case 'add':
                return 'Connect other service';
        }
    }
    getAuthWarn() {
        switch (this.state.mode) {
            case 'signin':
                return (<p>There is no matching account associated with that provider yet, <Link to='/signup'>Sign Up?</Link></p>);
            case 'signup':
                return (<p>There is already an account associated with that provider, <Link to='/auth'>Sign In?</Link></p>);
            case 'add':
                return (<p>There is already a separate account associated with that provider, please delete it and try again. <Link to={`/settings/${this.props.provider}`}>Back to Settings</Link></p>);
        }
    }
    getAuthLink(provider: 'github' | 'gitlab' | 'bitbucket'): string {
        switch(provider) {
            case 'github':
                switch(this.state.mode) {
                    case 'signin':
                        return `https://github.com/login/oauth/authorize?client_id=${config.github_auth.client_id}&redirect_uri=${config.github_auth.redirect_uri}&state=${this.state.state}`;
                    case 'signup':
                        return `https://github.com/apps/sharegit/installations/new?state=${this.state.state}`;
                }
            case 'gitlab':
                return `https://gitlab.com/oauth/authorize?client_id=${config.gitlab_auth.client_id}&redirect_uri=${config.gitlab_auth.redirect_uri}&response_type=code&state=${this.state.state}&scope=read_user+read_repository+read_api`
            case 'bitbucket':
                return `https://bitbucket.org/site/oauth2/authorize?client_id=${config.bitbucket_auth.client_id}&response_type=code&state=${this.state.state}`;
        }
    }
    render() {
        return (
            <div className={`${this.props.className} ${styles.authBox}`} id={this.props.id}>
                <h2>
                    {this.getAuthText()}
                </h2>
                {this.props.mode == 'signup' && 
                    <h3>And start sharing now</h3>}
                {
                    this.state.processing ? 
                    <div className='ui icon message'>
                        <i className='notched circle loading icon'></i>
                        <div className='content'>
                            <div className='header'>
                            Just one second
                            </div>
                            <p>Processing {this.getAuthText()} request</p>
                        </div>
                    </div>
                :
                    <div>
                        {this.state.failed ?
                        <div className="ui warning message">
                            <i className="close icon"></i>
                            <div className="header">
                                An Error occurred during {this.getAuthText()}!
                            </div>
                            {this.getAuthWarn()}
                        </div>
                    :
                        null}


                        {this.state.mode == 'add' ? 
                        null
                    :
                        <div>
                            <Button
                            className={styles.signupButton}
                            as='a'
                            href={this.getAuthLink('github')}>
                                    {this.getAuthText()} with <CustomIcon src={GithubMark}></CustomIcon> Github
                            </Button>
                            <Button
                            className={styles.signupButton}
                            as='a'
                            href={this.getAuthLink('gitlab')}>
                                    {this.getAuthText()} with <CustomIcon src={GitlabMark}></CustomIcon> GitLab
                            </Button>
                            <Button
                            className={styles.signupButton}
                            as='a'
                            href={this.getAuthLink('bitbucket')}>
                                    {this.getAuthText()} with <CustomIcon src={BitbucketMark}></CustomIcon> Bitbucket
                            </Button>
                        </div>}
                    </div>
                }
                {this.props.mode == 'signup' && 
                    <span>By Signing up you aggree to our Privacy Policy and the Terms of Service.</span>}
            </div>
        )
    }
}