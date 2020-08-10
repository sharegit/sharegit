import React from 'react';
import Repositories, {IRepositoriesProps} from './Repositories';
import Repository, {IRepositoryProps} from './Repository';
import {
  BrowserRouter as Router,
  RouteProps,
  Route,
  Link,
  RouteComponentProps
} from 'react-router-dom';

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
                  <Link to="/g-jozsef">Repositories of 'g-jozsef'</Link>
                </li>
              </ul>
            </nav>

            <Route path="/:user/:repo" exact component={(props: IRepositoryProps) => (
              <Repository
                user={props.match.params.user}
                repo={props.match.params.repo}
                sha="master"
                uri=""
                token={props.location.search} />
            )}></Route>

            
            <Route path="/:user/:repo/tree/:sha/:uri*" exact component={(props: IRepositoryProps) => (
              <Repository
                key={props.match.params.uri}
                user={props.match.params.user}
                repo={props.match.params.repo}
                sha={props.match.params.sha}
                uri={props.match.params.uri}
                token={props.location.search} /> // ?a=b&c=d&e=f
            )}></Route>

            <Route path="/:user" exact component={(props: IRepositoriesProps) => (
              <Repositories
                user={props.match.params.user} />
            )}></Route>
          </div>
        </Router>

      )
    }
}
