import React from 'react'
import axios, {AxiosResponse, CancelTokenSource} from 'axios'
import { RouteComponentProps } from 'react-router';
import RepoListElement from './RepoListElement';
import BranchSelector from './BranchSelector';
import { Link } from 'react-router-dom';
import config from '../config';

export interface IProps extends RouteComponentProps<any> {
    user: string;
    repo: string;
    sha: string;
    uri: string;
    token: string;
}

interface IState {
    objects: RepoObj[];
    cancelToken: CancelTokenSource;
    sha: string;
}

interface RepoObj {
    type: string;
    path: string;
}

export default class Repository extends React.Component<IProps, IState> {
    
    state : IState = {
        objects: [],
        cancelToken: axios.CancelToken.source(),
        sha: '',
    }

    constructor(props: IProps) {
        super(props)
        console.log(props)
        this.state.sha = props.sha;
    }

    componentDidMount() {
        console.log(this.props.token);
        console.log(`This is repo ${this.props.repo} of user ${this.props.user}`);
        this.queryServer();
    }

    queryServer() {
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        console.log(uri);
        const request = `${config.apiUrl}/repo/${this.props.user}/${this.props.repo}/tree/${this.state.sha}/${uri}`;
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
                <BranchSelector
                    user={this.props.user}
                    repo={this.props.repo}
                    current={this.state.sha}
                    onBranchSelectionChanged={(newValue: string) => {
                        this.state.sha = newValue;
                        this.setState(this.state);

                        this.props.history.push(`/${this.props.user}/${this.props.repo}/tree/${this.state.sha}/${this.props.uri == undefined ? '' : this.props.uri}`);
                        this.queryServer();
                    }}>
                </BranchSelector>

                <ul>
                    {
                        this.props.uri == undefined ?
                            null :
                            <li><Link to={`/${this.props.user}/${this.props.repo}/tree/${this.state.sha}/${this.props.uri.substring(0, this.props.uri.lastIndexOf('/'))}`}>..</Link></li>
                    }
                    
                    {
                        this.state.objects
                            .map((r : RepoObj) =>
                                <li key={r.path + this.state.sha}>
                                    <RepoListElement rooturi={`/${this.props.user}/${this.props.repo}/tree/${this.state.sha}`} updateParent={() => this.forceUpdate()} {...r}></RepoListElement>
                                </li>
                            )
                    }
                </ul>
            </div>
        )
    }
}