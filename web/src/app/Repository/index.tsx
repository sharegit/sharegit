import API, { BlobResult, TreeNode, TreeResult } from 'models/API';
import { BaseState } from 'models/BaseState';
import { Token } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Button, Icon, List } from 'semantic-ui-react';
import FileViewer from '../FileViewer/FileViewer';
import BranchSelector from './BranchSelector';
import Path from './Path';
import RepoListElement from './RepoListElement';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';

export interface IProps extends RouteComponentProps<any> {
    provider: 'github' | 'gitlab' | 'bitbucket';
    id: number;
    user: string;
    repo: string;
    sha: string;
    uri: string;
    type: 'tree' | 'blob';
}

interface IState extends BaseState {
    objects: TreeNode[];
    sha: string;
    blob?: BlobResult;
    readme?: BlobResult;
    tree: { [K in string]: TreeResult };
    downloadable: boolean;
}

export default class Repository extends React.Component<IProps, IState> {

    state: IState = {
        objects: [],
        cancelToken: API.aquireNewCancelToken(),
        sha: '',
        tree: {},
        downloadable: false
    }

    constructor(props: IProps) {
        super(props)
        console.log(props)
        this.state.sha = props.sha;
        
        const tokensStr = localStorage.getItem("alltokens")
        let tokens: Token[] = []
        if (tokensStr != null) {
            tokens = JSON.parse(tokensStr);
        }
        const token = localStorage.getItem('token');
        if(tokens != undefined) {
           if (tokens.some(x=>x.token == token && x.repositories.some(x => x.name == this.props.repo && x.owner == this.props.user && x.provider == this.props.provider && x.downloadable))){
               this.state.downloadable = true;
           }
        }
    }

    componentDidMount() {
        console.log(`This is repo ${this.props.repo} of user ${this.props.user}`);
        this.queryServer();
    }

    async queryTree(uri: string) {
        try {
            const repoTree = await API.getRepoTree(this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            repoTree.sort((a: TreeNode, b: TreeNode) => {
                if (a.type == b.type)
                    return a.path.localeCompare(b.path);
                else if ((a.type == 'tree' || a.type == 'dir') && (b.type == 'blob' || b.type == 'file'))
                    return -1;
                else if ((a.type == 'blob' || a.type == 'file') && (b.type == 'tree' || b.type == 'dir'))
                    return 1;

                return 0;
            });
            //  this.state.tree[uri] = repoTree
            this.state.objects = repoTree;
            console.log(repoTree);
            this.setState(this.state);
            
            const readmeFile = this.state.objects.find(x => x.path.toUpperCase().endsWith("README.MD") || x.path.toUpperCase().endsWith("README"));
            
            if(readmeFile != undefined) {

                const readme = await API.getRepoBlob(this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, readmeFile.path, this.state.cancelToken);
                
                this.state.readme = readme;
                this.setState(this.state);
            }
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    async queryBlob(uri: string) {
        try {
            const blob = await API.getRepoBlob(this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            
            this.state.blob = blob;
            this.setState(this.state);
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
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

    async startDownloading() {
        try {
            const downloadLink = await API.getDownloadLink(this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, this.state.cancelToken);
            window.open(downloadLink, "_blank");
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }

    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    render() {
        return (
            <ContentPanel background='light'>
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
                                    
                                    this.props.history.push(`/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${this.props.type}/${this.state.sha}/${this.props.uri == undefined ? '' : this.props.uri}`);
                                    this.queryServer();
                                }}>
                            </BranchSelector>
                        </div>
                        
                        <div id={styles.path}>
                            <Path
                                provider={this.props.provider}
                                id={this.props.id}
                                user={this.props.user}
                                repo={this.props.repo}
                                sha={this.state.sha}
                                path={this.props.uri == undefined ? '..' : `../${this.props.uri}`}
                                type={this.props.type}>
                            </Path>
                        </div>
                        {this.state.downloadable ? 
                        <div id={styles.download}>
                            <Button onClick={async () => {
                                this.startDownloading();
                            }}>Download as zip <Icon name='download'></Icon></Button>
                        </div>
                    :   null}
                        <div className="clear"></div>
                    </div>

                    {this.renderTree()}
                    {this.renderFileContents()}
                    {this.renderREADMEIfPresent()}
                </div >
            </ContentPanel>
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
                        {this.state.objects.map((r: TreeNode) =>
                            <RepoListElement
                                provider={this.props.provider}
                                id={this.props.id}
                                key={r.path + this.state.sha}
                                user={this.props.user}
                                repo={this.props.repo}
                                sha={this.state.sha}
                                lastCommitMessage={r.lastModifyCommitMessage}
                                lastModifyDate={r.lastModifyDate}
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