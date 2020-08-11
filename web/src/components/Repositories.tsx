import React from 'react'
import axios, {AxiosResponse} from 'axios'
import { RouteComponentProps } from 'react-router';
import { List } from 'semantic-ui-react'
import config from '../config';
import RepositoryCard from './RepositoryCard';

interface IProps {
    user: string;
}

interface IState {
    repositories: RepositoriesResponse;
}

interface RepositoriesResponse {
    total_count: number;
    repositories: Repository[];
}

interface Repository {
    name: string;
    private: boolean;
    description: string;
}


export interface IRepositoriesProps extends RouteComponentProps<IProps> { }
export default class Repositories extends React.Component<IProps, IState> {

    state : IState = {
        repositories: {
            total_count: 0,
            repositories: [] 
        }
    }

    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        const request = `${config.apiUrl}/repo/${this.props.user}`;
        console.log(`Requesting: ${request}`);
        axios.get<RepositoriesResponse>(request)
            .then((res: AxiosResponse<RepositoriesResponse>) => {
                console.log('Got result!');
                this.state.repositories = res.data;
                this.setState(this.state);
            })
            .catch(() => {
                console.log('Error!');
            });
    }

    render() {
        return (
            <div>
                <h2>Repository list of user 'g-jozsef'</h2>
                <List divided relaxed>
                    {
                        this.state.repositories.repositories
                            .map((r : Repository) =>
                                <RepositoryCard link={`/${this.props.user}/${r.name}/tree/master/`}
                                                name={r.name}
                                                private={r.private}
                                                description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                provider={"github"}></RepositoryCard>
                            )
                    }
                </List>
            </div>
        )
    }
}