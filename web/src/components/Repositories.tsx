import React from 'react'
import { RouteComponentProps } from 'react-router';
import { List } from 'semantic-ui-react'
import RepositoryCard from './RepositoryCard';
import API, { RepositoriesResponse, Repository } from '../models/API';
import { BaseState } from '../models/BaseComponent';

interface IProps {
    user: string;
}

interface IState extends BaseState {
    repositories: RepositoriesResponse;
}




export interface IRepositoriesProps extends RouteComponentProps<IProps> { }
export default class Repositories extends React.Component<IProps, IState> {

    state : IState = {
        repositories: {
            total_count: 0,
            repositories: [] 
        },
        cancelToken: API.aquireNewCancelToken()
    }

    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        API.getRepositories(this.props.user, this.state.cancelToken)
        .then((res : RepositoriesResponse) => {
            this.state.repositories = res;
            this.setState(this.state);
        })
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    render() {
        return (
            <div>
                <h2>Repository list of user 'g-jozsef'</h2>
                <List divided relaxed>
                    {
                        this.state.repositories.repositories
                            .map((r : Repository) =>
                                <RepositoryCard key={r.name}
                                                link={`/repo/${this.props.user}/${r.name}/tree/master/`}
                                                name={r.name}
                                                description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                provider='github'></RepositoryCard>
                            )
                    }
                </List>
            </div>
        )
    }
}