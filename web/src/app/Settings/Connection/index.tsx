import config from 'config';
import API, { GithubInstallations } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import Random from 'util/Random';
import style from './style.scss';
import { Link } from 'react-router-dom';
import BaseSettingsLayout from '../BaseSettingsLayout';
import ConfirmDialog from 'components/ConfirmDialog';
import { Button, TextField } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import DeleteIcon from 'assets/icons/delete.svg'
import GithubMark from 'assets/icons/github-mark-dark.png'
import GitlabMark from 'assets/icons/gitlab-mark.png'
import BitbucketMark from 'assets/icons/bitbucket-mark.svg'

interface IState extends BaseState {
    state: string;
    githubInstallations?: GithubInstallations;
    confirmConnectionRemoval: boolean;
}
export interface IProps {
    provider: 'github' | 'gitlab' | 'bitbucket';
    connected: boolean;
    forbidDisconnect?: boolean;
    username: string;
    onUpdate: () => void;
}

export default class Connection extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            state: this.constructState(),
            confirmConnectionRemoval: false
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
            try {
                const installations = await API.getGithubInstallations(this.state.cancelToken);
                this.setState({githubInstallations: installations});
            } catch (e) {
                if (!API.wasCancelled(e)) {
                    throw e;
                }
            }
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
    getProviderIcon(): string {
        switch(this.props.provider) {
            case 'bitbucket':
                return BitbucketMark;
            case 'github':
                return GithubMark;
            case 'gitlab':
                return GitlabMark;
        }
    }
    getNewConnectionLink(): string {
        switch(this.props.provider) {
            case 'bitbucket':
                return `https://bitbucket.org/site/oauth2/authorize?client_id=${config.bitbucket_auth.client_id}&response_type=code&state=${this.state.state}`;
            case 'github':
                return `https://github.com/apps/sharegit/installations/new?state=${this.state.state}`;
            case 'gitlab':
                return `https://gitlab.com/oauth/authorize?client_id=${config.gitlab_auth.client_id}&redirect_uri=${config.gitlab_auth.redirect_uri}&response_type=code&state=${this.state.state}&scope=read_user+read_repository+read_api`;
        }
    }
    async disconnect() {
        try {
            await API.disconnectService(this.props.provider, this.state.cancelToken);
            this.props.onUpdate();
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    render() {
        if(this.props.connected) {
            return (
                <div>
                    <TextField
                        id="oauth_conn"
                        InputProps={{readOnly: true}}
                        fullWidth
                        label='OAuth connection'
                        defaultValue={this.props.username}
                        helperText={`This is your currently authorized ${this.getPrettyProvider()} account.`}>
                    </TextField>
                    {this.renderGithubInstallation()}
                    <BaseSettingsLayout header='Dangerzone' isdangerous>
                        {!!this.props.forbidDisconnect && 
                            <span className={style.forbidDisconnect}>
                                You cannot disconnect this provider, please connect other services first or if you wish to delete your account, <Link to='/settings/dangerzone'>click here</Link>
                            </span>}
                        {this.props.forbidDisconnect !== true &&
                            <Button disabled={this.props.forbidDisconnect} onClick={ async () => {
                                this.setState({confirmConnectionRemoval: true}); }}>
                                <CustomIcon src={DeleteIcon}></CustomIcon>
                                Disconnect {this.getPrettyProvider()}
                            </Button>}
                        <ConfirmDialog
                            open={this.state.confirmConnectionRemoval}
                            onCancel={() => this.setState({confirmConnectionRemoval: false})}
                            onConfirm={async () => {
                                await this.disconnect();
                                this.setState({confirmConnectionRemoval: false})
                            }}
                            header='Confirm Service disconnection'
                            content={`Any and all links using this connection will stop working.
                            If the link contains a repository from other providers, those will still work.
                            ${this.props.provider == 'github' ? 'All of your GitHub installations will be removed from the accounts you have admin access to!'
                         : `We will forget about all of your ${this.getPrettyProvider()} related access tokens,
                            but please note that for ${this.getPrettyProvider()} you'll also have to manually disconnect ShareGit from your profile.`}`}
                            cancelLabel='Cancel'
                            confirmLabel={`Delete ${this.getPrettyProvider()} Connection`}>
                        </ConfirmDialog>
                    </BaseSettingsLayout>
                </div>
            )
        }
        return (
            <div>
                <Button
                    href={this.getNewConnectionLink()}>
                        Connect with <CustomIcon src={this.getProviderIcon()}></CustomIcon> {this.getPrettyProvider()}
                </Button>
            </div>
        )
    }
    renderGithubInstallation() {
        if (this.props.provider == 'github' && this.state.githubInstallations != undefined) {
            return (
                <div id={style.github}>
                    <span>Your active GitHub installations:</span>
                    <ul>
                        {this.state.githubInstallations.installations.filter(x=>!x.implicit).map(x=>
                            <li key={x.login}>
                                {x.login}
                                <hr />
                            </li>
                        )}
                        <li><Button 
                            href={this.getNewConnectionLink()}>
                                Add or change installations
                            </Button></li>
                    </ul>
                    <span>GitHub installations where you have partial, implicit access. You are probably a collaborator in one of their repositories.</span>
                    <ul>
                        {this.state.githubInstallations.installations.filter(x=>x.implicit).map(x=>
                            <li key={x.login}>
                                {x.login}
                                <hr />
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