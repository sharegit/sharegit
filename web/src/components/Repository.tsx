import React from 'react'
import { RouteComponentProps } from 'react-router';
import RepoListElement from './RepoListElement';
import BranchSelector from './BranchSelector';
import { Link } from 'react-router-dom';
import config from '../config';
import FileViewer, { DisplayedFile } from './FileViewer/FileViewer';
import { List } from 'semantic-ui-react';
import { BaseState } from '../models/BaseComponent';
import API, { RepoObj, BlobResult } from '../models/API';

export interface IProps extends RouteComponentProps<any> {
    user: string;
    repo: string;
    sha: string;
    uri: string;
    token: string;
    type: string;
}

interface IState extends BaseState {
    objects: RepoObj[];
    sha: string;
    blob? : BlobResult;
    readme? : BlobResult;
}

export default class Repository extends React.Component<IProps, IState> {
    
    state : IState = {
        objects: [],
        cancelToken: API.aquireNewCancelToken(),
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

    queryTree(uri: string) {
        API.getRepoTree(this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
        .then((res: RepoObj[]) => {
            this.state.objects = res.sort((a: RepoObj, b: RepoObj) => {
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
                return API.getRepoBlob(this.props.user, this.props.repo, this.state.sha, readme.path, this.state.cancelToken);
            } else {
                return undefined;
            }
        })
        .then((readme) => {
            if(readme != undefined) {
                this.state.readme = readme;
                this.setState(this.state);
            }
        })
        .catch(() => {
        });
    }
    queryBlob(uri: string) {
        API.getRepoBlob(this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
        .then((res: BlobResult) => {
            this.state.blob = res;
            this.setState(this.state);
        })
        .catch(() => {
            console.log('Error!');
        });
    }

    queryServer() {
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        console.log(uri);
        if(this.props.type == 'tree') {
            this.queryTree(uri);
        } else if (this.props.type == 'blob') {
            this.queryBlob(uri);
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
                    <Link to={`/repo/${this.props.user}/${this.props.repo}/tree/${this.state.sha}/${this.props.uri.substring(0, this.props.uri.lastIndexOf('/'))}`}>
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