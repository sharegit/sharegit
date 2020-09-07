import config from 'config';
import API, { ConnectedServices } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Button, Confirm, Form, FormProps, Icon, Message, Segment, MessageProps } from 'semantic-ui-react';
import Dictionary from 'util/Dictionary';
import Random from 'util/Random';
import styles from './style.scss';
import { Route, RouteComponentProps, Redirect, Link, Switch } from 'react-router-dom';
import PublicProfile from './PublicProfile';
import Account from './Account';
import Connection from './Connection';
import DangerZone from './DangerZone';
import BaseSettingsLayout from './BaseSettingsLayout';
import DismissableMessage from 'components/DismissableMessage';
import SettingsMenu from './SettingsMenu';


interface IState extends BaseState {
    accountDeletionOpen: boolean;
    successfullSave?: boolean;
    connectedServices?: ConnectedServices;
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
        console.log('REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE!')
        const connectedServices = await API.getConnectedServices(this.state.cancelToken);
        console.log(this.state.connectedServices);
        console.log(connectedServices);
        this.setState({connectedServices: connectedServices});
        console.log(this.state.connectedServices);
        return connectedServices;
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    render() {
        return (
            <div>
                {this.state.successfullSave == undefined ? null :
                <DismissableMessage style={this.state.successfullSave === false ? 'warning' : 'positive'}
                                    headerMessage={this.state.successfullSave === false ? 'An Unknown Error occurred during saving your settings!' : 'Settings successfully saved!'}
                                    active /> }

                <SettingsMenu githubConnected={this.state.connectedServices != undefined && this.state.connectedServices.githubLogin != null}
                              gitlabConnected={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != null}
                              bitbucketConnected={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != null}
                              location={this.props.location}
                              history={this.props.history}
                              match={this.props.match} />
                <div>
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
                                        username={this.state.connectedServices != undefined && this.state.connectedServices.githubLogin != undefined ? this.state.connectedServices.githubLogin : ''}/>
                        </BaseSettingsLayout> 
                    </Route>
                    <Route exact path={`${this.props.match.path}/gitlab`}>
                        <BaseSettingsLayout header='GitLab Connection'>
                            <Connection provider='gitlab'  
                                        connected={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != undefined}
                                        username={this.state.connectedServices != undefined && this.state.connectedServices.gitlabLogin != undefined ? this.state.connectedServices.gitlabLogin : ''}/>
                        </BaseSettingsLayout> 
                    </Route>
                    <Route exact path={`${this.props.match.path}/bitbucket`}>
                        <BaseSettingsLayout header='Bitbucket Connection'>
                            <Connection provider='bitbucket' 
                                        connected={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != undefined}
                                        username={this.state.connectedServices != undefined && this.state.connectedServices.bitbucketLogin != undefined ? this.state.connectedServices.bitbucketLogin : ''}/>
                        </BaseSettingsLayout> 
                    </Route>
                    <Route exact path={`${this.props.match.path}/dangerzone`}>
                        <BaseSettingsLayout header='Dangerzone' isdangerous>
                            <DangerZone /> 
                        </BaseSettingsLayout>
                    </Route>
                </div>
                
            </div>
        )
    }
}