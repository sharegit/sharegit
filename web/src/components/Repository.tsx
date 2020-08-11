import React from 'react'
import axios, {AxiosResponse, CancelTokenSource} from 'axios'
import { RouteComponentProps } from 'react-router';
import RepoListElement from './RepoListElement';
import BranchSelector from './BranchSelector';
import { Link } from 'react-router-dom';
import config from '../config';

interface IProps {
    user: string;
    repo: string;
    sha: string;
    uri: string;
    token: string;
}

interface IState {
    objects: RepoObj[];
    cancelToken: CancelTokenSource;
}

interface RepoObj {
    type: string;
    path: string;
}


export interface IRepositoryProps extends RouteComponentProps<IProps> { }
export default class Repository extends React.Component<IProps, IState> {

    state : IState = {
        objects: [],
        cancelToken: axios.CancelToken.source()
    }

    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        console.log(this.props.token);
        console.log(`This is repo ${this.props.repo} of user ${this.props.user}`);
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        const request = `${config.apiUrl}/repo/${this.props.user}/${this.props.repo}/tree/${this.props.sha}/${uri}`;
        console.log(`Requesting: ${request}`);
        axios.get<RepoObj[]>(request,  { cancelToken: this.state.cancelToken.token } )
            .then((res: AxiosResponse<RepoObj[]>) => {
                console.log('Got result!');
                this.state.objects = res.data;
                this.setState(this.state);
            })
            .catch(() => {
                console.log('Error!');
            });
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    render() {
        return (
            <div>
                <h2>This is repo {this.props.repo} of user {this.props.user}</h2>
                <BranchSelector branches={[this.props.sha]}></BranchSelector>

                <ul>
                    {
                        this.props.uri == undefined ?
                            null :
                            <li><Link to={`/${this.props.user}/${this.props.repo}/tree/${this.props.sha}/${this.props.uri.substring(0, this.props.uri.lastIndexOf('/'))}`}>..</Link></li>
                    }
                    
                    {
                        this.state.objects
                            .map((r : RepoObj) =>
                                <li key={r.path}>
                                    <RepoListElement rooturi={`/${this.props.user}/${this.props.repo}/tree/${this.props.sha}`} updateParent={() => this.forceUpdate()} {...r}></RepoListElement>
                                </li>
                            )
                    }
                </ul>
            </div>
        )
    }
}