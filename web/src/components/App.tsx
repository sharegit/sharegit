import React from 'react';
import Repositories, {IRepositoriesProps} from './Repositories';
import Repository, {IProps as IRepositoryProps} from './Repository';
import SharedLanding, {IProps as ISharedLandingProps} from './SharedLanding';
import {
  BrowserRouter as Router,
  RouteProps,
  Route,
  Link,
  RouteComponentProps
} from 'react-router-dom';

import highlight from 'highlight.js'
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
        <Router>
          <div>
            <nav>
              <ul>
                <li>
                  <Link to="/repo/g-jozsef">Repositories of 'g-jozsef'</Link>
                </li>
              </ul>
            </nav>

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
            )}>

            </Route>
          </div>
        </Router>

      )
    }
}
