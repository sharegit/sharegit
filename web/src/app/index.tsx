import highlight from 'highlight.js';
import { Action, Location, LocationState, UnregisterCallback } from 'history';
import React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';
import API from '../models/API';
import { BaseState } from '../models/BaseState';
import Authentication, { IProps as IAuthenticationProps } from './Authentication';
import Logout from './Authentication/Logout';
import Dashboard, { IProps as IDashboardProps } from './Dashboard';
import Header from './Header';
import Landing from './Landing';
import Repository, { IProps as IRepositoryProps } from './Repository';
import Settings from './Settings';
import ConfirmAccountDeletion, { IProps as IConfirmAccountDeletionProps } from './Settings/ConfirmAccountDeletion';
import SharedLanding, { IProps as ISharedLandingProps } from './SharedLanding';
import SharedWithMe, { IProps as ISharedWithMeProps } from './SharedWithMe';
import styles from './style.scss';
import NewTokenCreation from './CreateToken';


highlight.configure({
  tabReplace: '    '
})
highlight.initHighlightingOnLoad();

interface IProps extends RouteComponentProps<any> {
}
interface IState extends BaseState {
  isLoggedIn: boolean;
  unreg?: UnregisterCallback;
  cookies: Cookies;
}

export default class App extends React.Component<IProps, IState> {
  state: IState = {
    isLoggedIn: localStorage.getItem('OAuthJWT') != undefined,
    cancelToken: API.aquireNewCancelToken(),
    cookies: new Cookies()
  }
  componentDidMount() {
    console.log('APP MOUNTED!')
    const clientId = this.state.cookies.get('clientId')
    if(clientId == undefined) {
      const d = new Date();
      this.state.cookies.set('clientId', uuidv4(), { path: '/' , expires: new Date(d.getFullYear() + 2, d.getMonth(), d.getDate())});
    }

    this.state.unreg = this.props.history.listen(this.locationChanged.bind(this))
    this.locationChanged(this.props.location, 'PUSH');
  }
  componentWillUnmount() {
    if(this.state.unreg != undefined)
      this.state.unreg();
  }
  locationChanged(location: Location<LocationState>, action: Action) {
    console.log(location);
    const clientId = this.state.cookies.get('clientId')
    API.pushHit(location.pathname, clientId, this.state.cancelToken);
  }
  login() {
    this.state.isLoggedIn = true;
    this.setState(this.state);
  }
  logout() {
    this.state.isLoggedIn = false;
    this.setState(this.state);
  }
  render() {
    return (
        <div id={styles.app}>
            <Header isLoggedIn={this.state.isLoggedIn} />

            <div className={styles.appContentContainer}>

              <Route path='/' exact component={(props: any) => (
                <Landing
                 {...props}
                 {...props.match.params} />
              )}></Route>

              <Route path="/:provider/:id/:user/:repo" exact component={(props: IRepositoryProps) => (
                <Repository
                {...props}
                {...props.match.params} />
                )}></Route>

              
              <Route path="/:provider/:id/:user/:repo/:type/:sha/:uri*" exact component={(props: IRepositoryProps) => (
                <Repository
                key={props.match.params.uri}
                {...props} 
                {...props.match.params}/>
                )}></Route>

              <Route path="/share/:token" exact component={(props: ISharedLandingProps) => (
                <SharedLanding 
                {...props}
                {...props.match.params}/>
                )}></Route>

              <Route path="/share" exact component={(props: ISharedWithMeProps) => (
                <SharedWithMe 
                {...props}
                {...props.match.params}/>
                )}></Route>

              <Route path="/dashboard" exact component={(props: IDashboardProps) => (
                <Dashboard
                {...props}
                {...props.match.params}/>
              )}></Route>

              <Route path="/auth/:provider?" component={(props: IAuthenticationProps) => (
                <Authentication
                {...props}
                mode='signin'
                login={this.login.bind(this)}
                {...props.match.params}/>
              )}></Route>
              
              <Route path="/signup/:provider?" component={(props: IAuthenticationProps) => (
                <Authentication
                {...props}
                mode='signup'
                login={this.login.bind(this)}
                {...props.match.params}/>
              )}></Route>

              <Route path="/logout" exact component={(props: RouteComponentProps<any>) => (
                <Logout logout={this.logout.bind(this)}
                {...props}
                {...props.match.params}/>
              )}></Route>

              <Route path="/settings" component={Settings} />
              
              <Route path="/dashboard/confirmaccountdeletion/:token" exact component={(props: IConfirmAccountDeletionProps) => (
                <ConfirmAccountDeletion
                  {...props}
                  logout={this.logout.bind(this)}
                  {...props.match.params}/>
              )}></Route>

              <Route path="/create" component={NewTokenCreation} />
            </div>
        </div>

      )
    }
}
