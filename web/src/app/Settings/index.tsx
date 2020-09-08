import DismissableMessage from 'components/DismissableMessage';
import { Action, Location, LocationState, UnregisterCallback } from 'history';
import API, { ConnectedServices } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';
import Account from './Account';
import BaseSettingsLayout from './BaseSettingsLayout';
import Connection from './Connection';
import DangerZone from './DangerZone';
import PublicProfile from './PublicProfile';
import SettingsMenu from './SettingsMenu';
import ContentPanel from 'components/ContentPanel';
import style from './style.scss'


interface IState extends BaseState {
    accountDeletionOpen: boolean;
    successfullSave?: boolean;
    connectedServices?: ConnectedServices;
    unreg?: UnregisterCallback;
}
interface IProps extends RouteComponentProps<any> {

}

export default class Settings extends React.Component<IProps, IState> {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        accountDeletionOpen: false
    }
    constructor(props: IProps) {
        super(props);
    }

    async componentDidMount() {
        const connectedServices = await this.queryConnectedServices();

        this.setState({unreg:this.props.history.listen(this.locationChanged.bind(this))}) 
        this.locationChanged(this.props.location, 'PUSH');

        return connectedServices;
    }
    async queryConnectedServices() {
        const connectedServices = await API.getConnectedServices(this.state.cancelToken);
        this.setState({connectedServices: connectedServices});
        return connectedServices;
    }
    
    locationChanged(location: Location<LocationState>, action: Action) {
        console.log(location);
        this.setState({successfullSave: undefined})
    }
    componentWillUnmount() {
        if(this.state.unreg != undefined)
        this.state.unreg();
        this.state.cancelToken.cancel();
    }
    
    render() {
        return (
            <div id={style.settings}>
            {this.state.successfullSave == undefined ? null :
                <DismissableMessage style={this.state.successfullSave === false ? 'warning' : 'positive'}
                headerMessage={this.state.successfullSave === false ? 'An Unknown Error occurred during saving your settings!' : 'Settings successfully saved!'}
                active /> }

            <ContentPanel background='light'>
                    <SettingsMenu
                        className={style.menu}
                        githubConnected={this.state.connectedServices != undefined && this.state.connectedServices.githubLogin != null}
                        gitlabConnected={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != null}
                        bitbucketConnected={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != null}
                        location={this.props.location}
                        history={this.props.history}
                        match={this.props.match} />
                    <div id={style.content}>
                        <Route exact path={`${this.props.match.path}`}>
                            <Redirect to={`${this.props.match.path}/public`} />
                        </Route>

                        <Route exact path={`${this.props.match.path}/public`}>
                            <BaseSettingsLayout header='Public profile' >
                                <PublicProfile successCallback={() => this.setState({successfullSave: true})}
                                            failCallback={() => this.setState({successfullSave: false})} /> 
                            </BaseSettingsLayout>
                        </Route>
                        <Route exact path={`${this.props.match.path}/account`}>
                            <BaseSettingsLayout header='Account'>
                                <Account successCallback={() => this.setState({successfullSave: true})}
                                        failCallback={() => this.setState({successfullSave: false})} /> 
                            </BaseSettingsLayout>
                        </Route>
                        <Route exact path={`${this.props.match.path}/github`}>
                            <BaseSettingsLayout header='GitHub Connection'>
                                <Connection provider='github' 
                                            connected={this.state.connectedServices != undefined && this.state.connectedServices.githubLogin != undefined}
                                            forbidDisconnect={this.state.connectedServices != undefined && (this.state.connectedServices.gitlabLogin == undefined && this.state.connectedServices.bitbucketLogin == undefined)}
                                            username={this.state.connectedServices != undefined && this.state.connectedServices.githubLogin != undefined ? this.state.connectedServices.githubLogin : ''}
                                            onUpdate={async () => this.queryConnectedServices()}/>
                            </BaseSettingsLayout> 
                        </Route>
                        <Route exact path={`${this.props.match.path}/gitlab`}>
                            <BaseSettingsLayout header='GitLab Connection'>
                                <Connection provider='gitlab'  
                                            connected={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != undefined}
                                            forbidDisconnect={this.state.connectedServices != undefined && (this.state.connectedServices.githubLogin == undefined && this.state.connectedServices.bitbucketLogin == undefined)}
                                            username={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != undefined ? this.state.connectedServices.gitlabLogin : ''}
                                            onUpdate={async () => this.queryConnectedServices()}/>
                            </BaseSettingsLayout> 
                        </Route>
                        <Route exact path={`${this.props.match.path}/bitbucket`}>
                            <BaseSettingsLayout header='Bitbucket Connection'>
                                <Connection provider='bitbucket' 
                                            connected={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != undefined}
                                            forbidDisconnect={this.state.connectedServices != undefined && (this.state.connectedServices.gitlabLogin == undefined && this.state.connectedServices.githubLogin == undefined)}
                                            username={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != undefined ? this.state.connectedServices.bitbucketLogin : ''}
                                            onUpdate={async () => this.queryConnectedServices()}/>
                            </BaseSettingsLayout> 
                        </Route>
                        <Route exact path={`${this.props.match.path}/dangerzone`}>
                            <BaseSettingsLayout header='Dangerzone' isdangerous>
                                <DangerZone /> 
                            </BaseSettingsLayout>
                        </Route>
                    </div>
            </ContentPanel>
            </div>
        )
    }
}