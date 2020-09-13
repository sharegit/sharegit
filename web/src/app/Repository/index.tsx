import API, { BlobResult, TreeNode, TreeResult } from 'models/API';
import { BaseState } from 'models/BaseState';
import { Token, TokenRepo } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Button, Icon, List } from 'semantic-ui-react';
import FileViewer from '../FileViewer/FileViewer';
import BranchSelector from './BranchSelector';
import Path from './Path';
import RepoListElement from './RepoListElement';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import { Link } from 'react-router-dom';

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
    tokenMeta?: Token;
    repoMeta?: TokenRepo;
}

export default class Repository extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
        
        this.state = {
            sha: props.sha,
            objects: [],
            cancelToken: API.aquireNewCancelToken(),
            tree: {}
        }
    }

    async componentDidMount() {
        console.log(`This is repo ${this.props.repo} of user ${this.props.user}`);
        
        const query = new URLSearchParams(this.props.location.search);
        const tokenStr = query.get('token') as string;

        const tokens = new LocalStorageDictionary<Token>('alltokens');
        let existingToken = tokens.get(tokenStr)

        // If the user is seeing this repository with this token for the first time
        // Query the server for the token metadata and the shared repositories
        // just as if it were on the shared landing page
        try {
            if(existingToken == undefined) {
                const tokenMeta = await API.getSharedTokenMeta(tokenStr, this.state.cancelToken);
                const sharedRepositories = await API.getSharedRepositories(tokenStr, this.state.cancelToken);
                const tokenExp = tokenMeta.expireDate != 0 ? new Date(tokenMeta.expireDate * 60 * 1000) : undefined;
                
                existingToken = {
                    author: tokenMeta.author,
                    token: tokenMeta.token,
                    customName: tokenMeta.customName,
                    tokenExp: tokenExp,
                    repositories: sharedRepositories.repositories.map(x=>({
                        name: x.repo,
                        owner: x.owner,
                        provider: x.provider,
                        downloadable: x.downloadAllowed,
                        path: x.path
                    }))
                };

                tokens.put(tokenMeta.token, existingToken);
            }
            
            // At this point the token is 100% known
            // Find this repository
            const repoMeta = existingToken.repositories.find(x => x.name == this.props.repo && x.owner == this.props.user && x.provider == this.props.provider);
            if (repoMeta == undefined) {
                throw new Error('If token is valid for this repository, it should exist in the meta');
            }
            
            // Set token metadata
            this.setState({
                tokenMeta: existingToken,
                repoMeta: repoMeta
            }, () => {
                // Finally query the server for content
                this.queryServer();
            });
        } catch(e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }

    async queryTree(uri: string) {
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        try {
            const repoTree = await API.getRepoTree(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            repoTree.sort((a: TreeNode, b: TreeNode) => {
                if (a.type == b.type)
                    return a.path.localeCompare(b.path);
                else if ((a.type == 'tree' || a.type == 'dir') && (b.type == 'blob' || b.type == 'file'))
                    return -1;
                else if ((a.type == 'blob' || a.type == 'file') && (b.type == 'tree' || b.type == 'dir'))
                    return 1;

                return 0;
            });

            
            const readmeFile = repoTree.find(x => x.path.toUpperCase().endsWith("README.MD") || x.path.toUpperCase().endsWith("README"));
            
            const readme = readmeFile == undefined ? undefined : 
                await API.getRepoBlob(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, readmeFile.path, this.state.cancelToken);
            
            this.setState({
                objects: repoTree,
                readme: readme
            });
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    async queryBlob(uri: string) {
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        try {
            const blob = await API.getRepoBlob(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            
            this.setState({blob: blob});
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
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;
        
        try {
            const downloadLink = await API.getDownloadLink(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, this.state.cancelToken);
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
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        return (
            <ContentPanel background='light'>
                <div id={styles.repository}>
                    <Link to={`/share/${this.state.tokenMeta.token}`}>
                        <Button><Icon name='undo'></Icon>Browse other repositories shared under this link</Button>
                    </Link>
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
                                history={this.props.history}
                                location={this.props.location}
                                match={this.props.match}
                                key={`${this.state.sha}`}
                                user={this.props.user}
                                repo={this.props.repo}
                                current={this.state.sha}
                                onBranchSelectionChanged={(newValue: string) => {
                                    this.setState({sha: newValue},
                                        () => {
                                        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
                                            return;

                                        this.props.history.push(`/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${this.props.type}/${this.state.sha}${this.props.uri == undefined ? '' : '/' + this.props.uri}?token=${this.state.tokenMeta.token}`);
                                        this.queryServer();
                                    })
                                }}>
                            </BranchSelector>
                        </div>
                        
                        <div id={styles.path}>
                            <Path
                                token={this.state.tokenMeta.token}
                                provider={this.props.provider}
                                id={this.props.id}
                                user={this.props.user}
                                repo={this.props.repo}
                                sha={this.state.sha}
                                path={this.props.uri == undefined ? '..' : `../${this.props.uri}`}
                                restricted={this.state.repoMeta.path}
                                type={this.props.type}>
                            </Path>
                        </div>
                        {this.state.repoMeta.downloadable ? 
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
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        if (this.props.type == 'tree') {
            return (
                <div id={styles.tree}>
                    <List divided relaxed>
                        {this.state.objects.map((r: TreeNode) => (this.state.tokenMeta != undefined && this.state.repoMeta != undefined) &&
                            <RepoListElement
                                token={this.state.tokenMeta.token}
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