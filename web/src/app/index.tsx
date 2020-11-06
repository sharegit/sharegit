//import highlight from 'highlight.js';
import highlight from 'util/HighlightjsLineNumbers';
import { Action, Location, LocationState, UnregisterCallback } from 'history';
import React from 'react';
import { Route, RouteComponentProps, Redirect, Switch } from 'react-router-dom';
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
import NewTokenCreation, {IProps as INewTokenCreationProps} from './CreateToken';
import ContentPanel from 'components/ContentPanel';
import Footer from './Footer';
import Shares from './Shares';
import ProtectedRoute from 'components/ProtectedRoute';
import CookieConsent from 'components/CookieConsent';
import ErrorPage from './ErrorPage';
import Legal from './Legal';
import { Grid } from '@material-ui/core';

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
    const clientId = localStorage.getItem('clientId')
    if(clientId == undefined) {
      const d = new Date();
      localStorage.setItem('clientId', uuidv4());
    }

    this.state.unreg = this.props.history.listen(this.locationChanged.bind(this))
    this.locationChanged(this.props.location, 'PUSH');

    this.initGoogleAnalyticsIfConsented();
  }
  componentWillUnmount() {
    if(this.state.unreg != undefined)
      this.state.unreg();
  }
  locationChanged(location: Location<LocationState>, action: Action) {
    console.log(location);
    const clientId = localStorage.getItem('clientId')
    if(clientId != undefined){
      if (location.pathname.startsWith('/share/'))
        API.pushHit(location.pathname, clientId, this.state.cancelToken);
      else if (location.pathname.startsWith('/github')
            || location.pathname.startsWith('/gitlab')
            || location.pathname.startsWith('/bitbucket')) {
              const query = new URLSearchParams(location.search);
              const token = query.get('token');
              API.pushHit(`${location.pathname}?token=${token}`, clientId, this.state.cancelToken);
            }
    }
  }
  initGoogleAnalyticsIfConsented() {
    const consent = this.state.cookies.get('consented');
    switch(consent) {
      case 'full':

          function gtag(key: string, value: any){window.dataLayer.push(arguments);}

          gtag('js', new Date());
          gtag('config', 'UA-176858852-1');
        
          const ga = document.createElement('script');
          ga.async = true;
          ga.src = 'https://www.googletagmanager.com/gtag/js?id=UA-176858852-1';

          const s = document.getElementsByTagName('script')[0];
          if(s.parentNode != null)
            s.parentNode.insertBefore(ga, s);
        break;
      case 'essential':
        break;
    }
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
        <Grid id={styles.app} container>
            <CookieConsent onConsented={this.initGoogleAnalyticsIfConsented.bind(this)} />

            <Header isLoggedIn={this.state.isLoggedIn} />

            <Grid container direction='column' className={`min-vh-100 d-flex h-100 flex-column clear-top ${styles.appContentContainer}`}>
              <Switch>
                <Route path='/' exact component={(props: any) => {
                  if (this.state.isLoggedIn)
                    return (<Shares
                      {...props}
                      {...props.match.params}/>)
                  else
                    return (<Landing
                      {...props}
                      {...props.match.params} />)
                }} />

                <Route path="/:provider/:id/:user/:repo" exact component={(props: IRepositoryProps) => (
                  <Repository
                  {...props}
                  {...props.match.params} />
                  )} />

                <Route path="/:provider/:id/:user/:repo/:type/:sha/:uri*" exact component={(props: IRepositoryProps) => (
                  <Repository
                  key={props.match.params.uri}
                  {...props} 
                  {...props.match.params}/>
                  )} />

                <Route path="/share/:token" exact component={(props: ISharedLandingProps) => (
                  <SharedLanding 
                  {...props}
                  {...props.match.params}/>
                  )} />

                <Route path="/share" exact component={(props: ISharedWithMeProps) => (
                  <SharedWithMe 
                  {...props}
                  {...props.match.params}/>
                  )} />

                <Route path="/auth/:provider?" component={(props: IAuthenticationProps) => (
                  <ContentPanel background='gradient'>
                    <Authentication
                    {...props}
                    mode='signin'
                    login={this.login.bind(this)}
                    {...props.match.params}/>
                  </ContentPanel>
                )} />
                
                <Route path="/signup/:provider?" component={(props: IAuthenticationProps) => (
                  <ContentPanel background='gradient'>
                    <Authentication
                    {...props}
                    mode='signup'
                    login={this.login.bind(this)}
                    {...props.match.params}/>
                  </ContentPanel>
                )} />

                <ProtectedRoute isAuthenticated={this.state.isLoggedIn} path="/logout" exact component={(props: RouteComponentProps<any>) => (
                  <Logout logout={this.logout.bind(this)}
                  {...props}
                  {...props.match.params}/>
                )} />

                <ProtectedRoute isAuthenticated={this.state.isLoggedIn} path="/settings" component={Settings} />
                
                <ProtectedRoute isAuthenticated={this.state.isLoggedIn} path="/dashboard/confirmaccountdeletion/:token" exact component={(props: IConfirmAccountDeletionProps) => (
                  <ConfirmAccountDeletion
                    {...props}
                    logout={this.logout.bind(this)}
                    {...props.match.params}/>
                )} />

                <Route path="/create" component={NewTokenCreation} mode='create' />
                <Route path="/edit/:token" exact component={(props: INewTokenCreationProps) => (
                  <NewTokenCreation 
                  {...props}
                  {...props.match.params}
                  mode='edit'/>
                  )} />
                <Route path="/duplicate/:token" exact component={(props: INewTokenCreationProps) => (
                  <NewTokenCreation 
                  {...props}
                  {...props.match.params}
                  mode='duplicate'/>
                  )} />

                <Route path='/legal' component={(props: RouteComponentProps<any>) => 
                  <Legal {...props} />
                }/>

                <Route path='/error' component={ErrorPage} />
                
                <Redirect from='*' to='/error' />
              </Switch>
            </Grid>
            
            <Footer />
        </Grid>

      )
    }
}
