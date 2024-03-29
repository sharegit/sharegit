import API, { BlobResult, TreeNode, TreeResult } from 'models/API';
import { BaseState } from 'models/BaseState';
import { Token, TokenRepo } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import FileViewer from '../FileViewer/FileViewer';
import BranchSelector from './BranchSelector';
import Path from './Path';
import RepoListElement from './RepoListElement';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import { Link } from 'react-router-dom';
import { Button, List, Grid } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import FirstPageIcon from 'assets/icons/first-page.svg';
import GetAppIcon from 'assets/icons/get-app.svg';
import HourglassIcon from 'assets/icons/hourglass.svg';
import Loading from 'components/Loading';

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
    startingDownload?: boolean;
    loading: boolean;
    large: boolean;
}

export default class Repository extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
        
        this.state = {
            sha: props.sha,
            objects: [],
            cancelToken: API.aquireNewCancelToken(),
            tree: {},
            loading: false,
            large: false
        }
    }

    async componentDidMount() {
        console.log(`This is repo ${this.props.repo} of user ${this.props.user}`);
        this.setState({loading: true});
        const query = new URLSearchParams(this.props.location.search);
        const tokenStr = query.get('token') as string;
        const large = query.get('large') as string;

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
                    })),
                    firstOpenDate: new Date()
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
                repoMeta: repoMeta,
                large: !!large && large.length > 0
            }, () => {
                // Finally query the server for content
                this.queryServer();
            });
        } catch(e) {
            if (!API.wasCancelled(e)) {
                this.props.history.replace('/error');
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
            this.setState({loading: false});
        } catch (e) {
            if (!API.wasCancelled(e)) {
                this.props.history.replace('/error');
            }
        }
    }
    async queryBlob(uri: string) {
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        try {
            const blob = await API.getRepoBlob(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, uri, this.state.cancelToken)
            
            this.setState({blob: blob});
            this.setState({loading: false});
        } catch (e) {
            if (!API.wasCancelled(e)) {
                this.props.history.replace('/error');
            }
        }
    }

    queryServer() {
        this.setState({loading: true});
        const uri = this.props.uri == undefined ? '' : this.props.uri;
        console.log(uri);
        if (this.props.type == 'tree') {
            this.queryTree(uri);
        } else if (this.props.type == 'blob' && !this.state.large) {
            this.queryBlob(uri);
        } else {
            this.setState({loading: false});
        }
    }

    async startDownloading() {
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;
        
        this.setState({startingDownload: true});

        try {
            const downloadLink = await API.getDownloadLink(this.state.tokenMeta.token, this.props.provider, this.props.id, this.props.user, this.props.repo, this.state.sha, this.state.cancelToken);
            window.open(downloadLink, "_blank");
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
        this.setState({startingDownload: undefined});
    }

    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    render() {
        if (this.state.tokenMeta == undefined || this.state.repoMeta == undefined)
            return null;

        return (
            <div id={styles.repository}>
                <ContentPanel background='light'>
                    <Grid direction='column' item container>
                        <Link to={`/share/${this.state.tokenMeta.token}`}>
                            <Button><CustomIcon src={FirstPageIcon} /> <pre>  </pre> Browse other repositories shared under this link</Button>
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
                                    path={this.props.uri == undefined ? this.props.repo : `${this.props.repo}/${this.props.uri}`}
                                    restricted={this.state.repoMeta.path}
                                    type={this.props.type}>
                                </Path>
                            </div>
                            {this.state.repoMeta.downloadable ? 
                            <div id={styles.download}>
                                {this.state.startingDownload !== true ?
                                <Button onClick={async () => {
                                    this.startDownloading();
                                }}>Download as zip <CustomIcon src={GetAppIcon} /></Button>
                            :
                                <Button disabled>Downloading as zip <CustomIcon src={HourglassIcon} /></Button>
                                }
                            </div>
                        :   null}
                            <div className="clear"></div>
                        </div>
                        {this.state.loading ? <Loading /> : null}
                        {this.renderTree()}
                        {this.renderFileContents()}
                        {this.renderREADMEIfPresent()}
                    </Grid>
                </ContentPanel>
            </div >
        )
    }
    renderFileContents() {
        if (this.props.type == 'blob' && this.state.blob != undefined) {
            return <FileViewer key={this.state.blob.file} displayed={this.state.blob} />
        } else if(this.state.large) {
            return (<div>
                    <p>File is too large to display...</p>
                    {this.state.repoMeta != undefined && this.state.repoMeta.downloadable && 
                        <div>
                            <p>Please download the whole repository to view this file.</p>
                            {this.state.startingDownload !== true ?
                                <Button onClick={async () => {
                                    this.startDownloading();
                                }}>Download as zip <CustomIcon src={GetAppIcon} /></Button>
                            :
                                <Button disabled>Downloading as zip <CustomIcon src={HourglassIcon} /></Button>
                                }
                        </div>}
                    {this.state.repoMeta != undefined && !this.state.repoMeta.downloadable && 
                        <p>Please request download permission from the source of your link for this repository in order to view this file.</p>}
                </div>)
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
                    <List>
                        {this.state.objects.map((r: TreeNode) => (this.state.tokenMeta != undefined && this.state.repoMeta != undefined) && (() => {console.log(r.size); return true;})() &&
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
                                type={r.type}
                                large={r.size / 1024 / 1024 > 1}>
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