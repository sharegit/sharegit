import config from 'config';
import API, { GithubInstallations } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Button, Form, Icon } from 'semantic-ui-react';
import Random from 'util/Random';

interface IState extends BaseState {
    state: string;
    githubInstallations?: GithubInstallations;
}
export interface IProps {
    provider: 'github' | 'gitlab' | 'bitbucket';
    connected: boolean;
    username: string;
}

export default class Connection extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            state: this.constructState(),
        }
    }
    constructState(): string {
        return btoa(JSON.stringify({
            t: Random.str(64),
            d: config.isDev,
            m: 'add'
        }));
    }
    async componentDidMount() {
        localStorage.setItem('oauthState', this.state.state);
        if (this.props.provider == 'github') {
            const installations = await API.getGithubInstallations(this.state.cancelToken);
            this.setState({githubInstallations: installations});
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    getPrettyProvider(): string {
        switch(this.props.provider) {
            case 'bitbucket':
                return 'Bitbucket';
            case 'github':
                return 'GitHub';
            case 'gitlab':
                return 'GitLab';
        }
    }
    getNewConnectionLink(): string {
        switch(this.props.provider) {
            case 'bitbucket':
                return `https:bitbucket.org/site/oauth2/authorize?client_id=${config.bitbucket_auth.client_id}&response_type=code&state=${this.state.state}`;
            case 'github':
                return `https:github.com/apps/sharegit/installations/new?state=${this.state.state}`;
            case 'gitlab':
                return `https:gitlab.com/oauth/authorize?client_id=${config.gitlab_auth.client_id}&redirect_uri=${config.gitlab_auth.redirect_uri}&response_type=code&state=${this.state.state}&scope=read_user+read_repository+read_api`;
        }
    }
    render() {
        if(this.props.connected) {
            return (
                <div>
                    <Form>
                        <Form.Field id="displayName">
                            <label>OAuth connection</label>
                            <input readOnly id="oauthLoginId" value={this.props.username} />
                            <span>This is your currently authorized {this.getPrettyProvider()} account.</span>
                        </Form.Field>
                    </Form>
                    {this.renderGithubInstallation()}
                </div>
            )
        }
        return (
            <div>
                <Button
                    as='a'
                    primary
                    href={this.getNewConnectionLink()}>
                        <Icon name={this.props.provider}></Icon>
                        Connect with {this.getPrettyProvider()}
                </Button>
            </div>
        )
    }
    renderGithubInstallation() {
        if (this.props.provider == 'github' && this.state.githubInstallations != undefined) {
            return (
                <div>
                    Your active github installations:
                    <ul>
                        {this.state.githubInstallations.installations.map(x=>
                            <li key={x.login}>
                                {x.login}
                            </li>
                        )}
                    </ul>
                </div>
            )
        } else {
            return null;
        }
    }
}