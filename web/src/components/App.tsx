import React from 'react';
import Repositories, {IRepositoriesProps} from './Repositories';
import Repository, {IProps as IRepositoryProps} from './Repository';
import SharedLanding, {IProps as ISharedLandingProps} from './SharedLanding';
import SharedWithMe, {IProps as ISharedWithMeProps} from './SharedWithMe';
import Dashboard, {IProps as IDashboardProps} from './Dashboard';
import Authentication, {IProps as IAuthenticationProps} from './Authentication';
import {
  BrowserRouter as Router,
  RouteProps,
  Route,
  Link,
  RouteComponentProps
} from 'react-router-dom';
import styles from '../styles/App.scss';

import highlight from 'highlight.js'
import NavMenuItem from './NavMenuItem';
highlight.configure({
  tabReplace: '    '
})
highlight.initHighlightingOnLoad();

interface IProps {
}
interface IState {
}

export default class App extends React.Component<IProps, IState> {
  render() {
    return (
        <div id={styles.app}>
          <Router>
            <nav>
              <div id={styles.leftMenu}>
                <ul>
                  <NavMenuItem uri="/">Shared with me</NavMenuItem>
                  <NavMenuItem loginRequired uri="/dashboard">Dashboard</NavMenuItem>
                </ul>
              </div>
              <div id={styles.rightMenu}>
                <ul>
                  <NavMenuItem logoutRequired uri="/auth">Login</NavMenuItem>
                  <NavMenuItem loginRequired uri="/logout">Logout</NavMenuItem>
                </ul>
              </div>
              <div className="clear"></div>
            </nav>

            <div className={styles.appContentContainer}>



              <Route path="/repo/:user/:repo" exact component={(props: IRepositoryProps) => (
                <Repository
                {...props}
                {...props.match.params} />
                )}></Route>

              
              <Route path="/repo/:user/:repo/:type/:sha/:uri*" exact component={(props: IRepositoryProps) => (
                <Repository
                key={props.match.params.uri}
                {...props} 
                {...props.match.params}/>
                )}></Route>

              <Route path="/repo/:user" exact component={(props: IRepositoriesProps) => (
                <Repositories
                user={props.match.params.user} />
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

              <Route path="/auth" exact component={(props: IAuthenticationProps) => (
                <Authentication
                {...props}
                {...props.match.params}/>
              )}></Route>
            </div>
          </Router>
        </div>

      )
    }
}
