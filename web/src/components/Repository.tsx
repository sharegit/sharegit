import React from 'react'
import axios, {AxiosResponse, CancelTokenSource} from 'axios'
import { RouteComponentProps } from 'react-router';
import RepoListElement from './RepoListElement';
import BranchSelector from './BranchSelector';
import { Link } from 'react-router-dom';
import config from '../config';
import FileViewer, { DisplayedFile } from './FileViewer/FileViewer';
import { List } from 'semantic-ui-react';

export interface IProps extends RouteComponentProps<any> {
    user: string;
    repo: string;
    sha: string;
    uri: string;
    token: string;
    type: string;
}

interface IState {
    objects: RepoObj[];
    cancelToken: CancelTokenSource;
    sha: string;
    blob? : DisplayedFile;
    readme? : DisplayedFile;
}

interface RepoObj {
    type: 'tree' | 'blob';
    path: string;
    author: string;
    lastmodifydate: string;
    lastmodifycommitmessage: string;
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

    queryTree(request: string) {
        axios.get<RepoObj[]>(request,  { cancelToken: this.state.cancelToken.token } )
        .then((res: AxiosResponse<RepoObj[]>) => {
            console.log('Got result!');
            this.state.objects = res.data.sort((a: RepoObj, b: RepoObj) => {
                if (a.type == b.type)
                    return a.path.localeCompare(b.path);
                else if (a.type == 'tree' && b.type == 'blob')
                    return -1;
                else if (a.type == 'blob' && b.type == 'tree')
                    return 1;

                return 0;
            });
            this.setState(this.state);
            
            const readme = this.state.objects.find(x => x.path.toUpperCase().endsWith("README.MD") || x.path.toUpperCase().endsWith("README"));
            if(readme != undefined) {
                const readmeRequest = `${config.apiUrl}/repo/${this.props.user}/${this.props.repo}/blob/${this.state.sha}/${readme.path}`;
                console.log("Requesting README on " + readmeRequest);
                axios.get<DisplayedFile>(readmeRequest,
                    { cancelToken: this.state.cancelToken.token } )
                    .then((res: AxiosResponse<DisplayedFile>) => {
                        console.log(`Got Blob data for ${res.data.file}!`);
                        this.state.readme = res.data;
                        this.setState(this.state);
                    }).catch(() => {
                        console.log("This tree does not contain a README file!");
                    });
            }
        })
        .catch(() => {
            console.log('Error!');
        });
    }
    queryBlob(request: string) {
        axios.get<DisplayedFile>(request,  { cancelToken: this.state.cancelToken.token } )
        .then((res: AxiosResponse<DisplayedFile>) => {
            console.log(`Got Blob data for ${res.data.file}!`);
            this.state.blob = res.data;
            this.setState(this.state);
        })
        .catch(() => {
            console.log('Error!');
        });
    }

    queryServer() {
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        console.log(uri);
        const request = `${config.apiUrl}/repo/${this.props.user}/${this.props.repo}/${this.props.type}/${this.state.sha}/${uri}`;
        console.log(`Requesting: ${request}`);
        if(this.props.type == 'tree') {
            this.queryTree(request);
        } else if (this.props.type == 'blob') {
            this.queryBlob(request);
        }
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

                        this.props.history.push(`/${this.props.user}/${this.props.repo}/${this.props.type}/${this.state.sha}/${this.props.uri == undefined ? '' : this.props.uri}`);
                        this.queryServer();
                    }}>
                </BranchSelector>

                {this.renderTree()}
                {this.renderFileContents()}
                {this.renderREADMEIfPresent()}
            </div>
        )
    }
    renderFileContents() {
        if(this.props.type == 'blob' && this.state.blob != undefined) {
            return <FileViewer key={this.state.blob.file} displayed={this.state.blob} />
        } else {
            return null;
        }
    }
    renderStepUpLink() {
        if (this.props.uri != undefined) {
            return (
                <List.Item>
                    <Link to={`/${this.props.user}/${this.props.repo}/tree/${this.state.sha}/${this.props.uri.substring(0, this.props.uri.lastIndexOf('/'))}`}>
                        ..
                    </Link>
                </List.Item>
            )
        } else {
            return null;
        }
    }
    renderTree() {
        if(this.props.type == 'tree') {
            return (
                <div>
                    <List divided relaxed>
                    {this.renderStepUpLink()}
                    {this.state.objects.map((r : RepoObj) =>
                        <RepoListElement
                            key={r.path + this.state.sha}
                            user={this.props.user}
                            repo={this.props.repo}
                            sha={this.state.sha}
                            lastCommitMessage={r.lastmodifycommitmessage}
                            lastModifyDate={r.lastmodifydate}
                            author={r.author}
                            path={r.path}
                            type={r.type}>
                        </RepoListElement>
                    )}
                    </List>
                </div>
            )
        } else {
            return null;
        }
    }
    renderREADMEIfPresent() {
        if(this.state.readme != undefined) {
            return <FileViewer key={this.state.readme.file} displayed={this.state.readme} />
        } else {
            return null;
        }
    }
}