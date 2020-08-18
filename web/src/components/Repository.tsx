import React from 'react'
import { RouteComponentProps } from 'react-router';
import RepoListElement from './RepoListElement';
import BranchSelector from './BranchSelector';
import { Link } from 'react-router-dom';
import FileViewer from './FileViewer/FileViewer';
import { List } from 'semantic-ui-react';
import { BaseState } from '../models/BaseComponent';
import API, { RepoObj, BlobResult } from '../models/API';
import Path from './Path';
import styles from '../styles/Repository.scss';

export interface IProps extends RouteComponentProps<any> {
    user: string;
    repo: string;
    sha: string;
    uri: string;
    token: string;
    type: 'tree' | 'blob';
}

interface IState extends BaseState {
    objects: RepoObj[];
    sha: string;
    blob?: BlobResult;
    readme?: BlobResult;
}

export default class Repository extends React.Component<IProps, IState> {

    state: IState = {
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

    async queryTree(uri: string) {
        const repoTree = await API.getRepoTree(this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            
        this.state.objects = repoTree.sort((a: RepoObj, b: RepoObj) => {
            if (a.type == b.type)
                return a.path.localeCompare(b.path);
            else if (a.type == 'tree' && b.type == 'blob')
                return -1;
            else if (a.type == 'blob' && b.type == 'tree')
                return 1;

            return 0;
        });
        this.setState(this.state);

        const readmeFile = this.state.objects.find(x => x.path.toUpperCase().endsWith("README.MD") || x.path.toUpperCase().endsWith("README"));
        
        if(readmeFile != undefined) {

            const readme = await API.getRepoBlob(this.props.user, this.props.repo, this.state.sha, readmeFile.path, this.state.cancelToken);
        
            this.state.readme = readme;
            this.setState(this.state);
        }
    }
    async queryBlob(uri: string) {
        const blob = await API.getRepoBlob(this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)

        this.state.blob = blob;
        this.setState(this.state);
    }

    queryServer() {
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        console.log(uri);
        if (this.props.type == 'tree') {
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
            <div id={styles.repository}>
                <div id={styles.repositoryHeader}>
                    <div id={styles.currentRepository}>
                        <h3>{this.props.repo}</h3>
                    </div>
                    <div id={styles.authorText}>
                        <p> <b>Author:</b> <i>{this.props.user}</i></p>
                    </div>
                    <div className="clear"></div>
                    <div id={styles.branch}>
                        <BranchSelector
                            key={`${this.state.sha}`}
                            user={this.props.user}
                            repo={this.props.repo}
                            current={this.state.sha}
                            onBranchSelectionChanged={(newValue: string) => {
                                this.state.sha = newValue;
                                this.setState(this.state);
                                
                                this.props.history.push(`/repo/${this.props.user}/${this.props.repo}/${this.props.type}/${this.state.sha}/${this.props.uri == undefined ? '' : this.props.uri}`);
                                this.queryServer();
                            }}>
                        </BranchSelector>
                    </div>
                    
                    <div id={styles.path}>
                        <Path
                            user={this.props.user}
                            repo={this.props.repo}
                            sha={this.state.sha}
                            path={this.props.uri == undefined ? '..' : `../${this.props.uri}`}
                            type={this.props.type}>
                        </Path>
                    </div>
                    <div className="clear"></div>
                </div>

                {this.renderTree()}
                {this.renderFileContents()}
                {this.renderREADMEIfPresent()}
            </div >
        )
    }
    renderFileContents() {
        if (this.props.type == 'blob' && this.state.blob != undefined) {
            return <FileViewer key={this.state.blob.file} displayed={this.state.blob} />
        } else {
            return null;
        }
    }

    renderTree() {
        if (this.props.type == 'tree') {
            return (
                <div id={styles.tree}>
                    <List divided relaxed>
                        {this.state.objects.map((r: RepoObj) =>
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
        if (this.state.readme != undefined) {
            return <FileViewer key={this.state.readme.file} displayed={this.state.readme} />
        } else {
            return null;
        }
    }
}