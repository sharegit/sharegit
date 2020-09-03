import React from 'react';
import Repository, {IProps as IRepositoryProps} from './Repository';
import SharedLanding, {IProps as ISharedLandingProps} from './SharedLanding';
import SharedWithMe, {IProps as ISharedWithMeProps} from './SharedWithMe';
import Dashboard, {IProps as IDashboardProps} from './Dashboard';
import Authentication, {IProps as IAuthenticationProps} from './Authentication';
import { Route,  RouteComponentProps } from 'react-router-dom';
import styles from '../styles/App.scss';

import highlight from 'highlight.js'
import NavMenuItem from './NavMenuItem';
import Logout from './Logout';
import Settings from './Settings';
import ConfirmAccountDeletion, {IProps as IConfirmAccountDeletionProps} from './ConfirmAccountDeletion';
import { UnregisterCallback, Location, LocationState, Action } from 'history';
import API from '../models/API';
import { BaseState } from '../models/BaseComponent';
import Cookies from 'universal-cookie';
import { v4 as uuidv4 } from 'uuid';

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
            <nav>
              <div id={styles.leftMenu}>
                <ul>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} uri="/">Shared with me</NavMenuItem>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                </ul>
              </div>
              <div id={styles.rightMenu}>
                <ul>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} logoutRequired uri="/auth">Sign in</NavMenuItem>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} logoutRequired uri="/signup">Sign up</NavMenuItem>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} loginRequired uri="/dashboard/settings">Settings</NavMenuItem>
                  <NavMenuItem isLoggedIn={this.state.isLoggedIn} loginRequired uri="/logout">Logout</NavMenuItem>
                </ul>
              </div>
              <div className="clear"></div>
            </nav>

            <div className={styles.appContentContainer}>



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

              <Route path="/" exact component={(props: ISharedWithMeProps) => (
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

              <Route path="/dashboard/settings" exact component={(props: any) => (
                <Settings
                  {...props}
                  {...props.match.params}/>
              )}></Route>
              
              <Route path="/dashboard/confirmaccountdeletion/:token" exact component={(props: IConfirmAccountDeletionProps) => (
                <ConfirmAccountDeletion
                  {...props}
                  logout={this.logout.bind(this)}
                  {...props.match.params}/>
              )}></Route>
            </div>
        </div>

      )
    }
}
