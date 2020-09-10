import API, { SharedRepository } from 'models/API';
import { BaseState } from 'models/BaseState';
import { Token } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { List } from 'semantic-ui-react';
import RepositoryCard from './RepositoryCard';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';

export interface IProps extends RouteComponentProps<any> {
    token: string;
}

interface IState extends BaseState {
    tokenValid?: boolean;
    repositories: SharedRepository[];
    author: string;
    authorWebsite: string;
    authorBio: string;
    customName: string;
    tokenExp?: Date;
}

export default class SharedLanding extends React.Component<IProps, IState> {
    state: IState = {
        tokenValid: undefined,
        cancelToken: API.aquireNewCancelToken(),
        repositories: [],
        author: '',
        authorBio: '',
        authorWebsite: '',
        customName: '',
    }
    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        console.log(this.props.token);
        
        this.validateToken();
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    async validateToken() {
        try {
            const tokenMeta = await API.getSharedTokenMeta(this.props.token, this.state.cancelToken);
            const sharedRepositories = await API.getSharedRepositories(this.props.token, this.state.cancelToken)
            
            this.state.tokenValid = true;
            this.state.repositories = sharedRepositories.repositories;
            if(sharedRepositories.repositories.length > 0)
            this.state.author = tokenMeta.author;
            this.state.authorBio = tokenMeta.authorBio;
            this.state.authorWebsite = tokenMeta.authorWebsite;
            this.state.customName = tokenMeta.customName;
            if(tokenMeta.expireDate != 0)
                this.state.tokenExp = new Date(tokenMeta.expireDate * 60 * 1000);
            this.setState(this.state);
            
            const tokens = new LocalStorageDictionary<Token>('alltokens');
            
            tokens.put(this.props.token, {
                author: this.state.author,
                token: this.props.token,
                customName: this.state.customName,
                tokenExp: this.state.tokenExp,
                repositories: sharedRepositories.repositories.map(x=>({
                    name: x.repo,
                    owner: x.owner,
                    provider: x.provider,
                    downloadable: x.downloadAllowed
                }))
            })
        } catch(error) {
            this.state.tokenValid = false;
            this.setState(this.state);
            if (!API.wasCancelled(error)) {
                throw error;
            }
        }
    }
    getSharedPathType(path: string | undefined): 'tree' | 'blob' {
        if(path == undefined || path.endsWith("/"))
            return 'tree';
        else
            return 'blob';
    }
    getAdditionalPath(path: string | undefined): '' | string {
        if(path == undefined)
            return '';
        else if (path[path.length-1] == '/') {
            return `/${path.substring(0, path.length-2)}`;
        } else {
            return `/${path}`;
        }
    }

    render() {
        return (
            <ContentPanel background='light'>
                <div id={styles.sharelandingcontainer}>
                    <div id={styles.landingHeader}>
                        <div id={styles.availableReposText}>
                            <h3>Repositories shared with you</h3>
                        </div>
                        <div id={styles.authorText}>
                            <p> <b>Author:</b> <i>{this.state.author}</i> <br />
                            <b>Website:</b><a href={!!this.state.authorWebsite ? this.state.authorWebsite : ''}><i>{this.state.authorWebsite}</i></a></p>
                        </div>
                        <div className="clear"></div>
                    </div>
                    {!!this.state.authorBio ? <p>The author provided the following Biography about themselves: <br />{this.state.authorBio}</p> : null}
                    {this.state.tokenExp != undefined && 
                        'This token will expire on: ' + this.state.tokenExp}
                    <div id={styles.tokenChecker}>
                        {this.renderTokenValidity()}
                    </div>
                    <div className={styles.myclass}>
                        <List divided relaxed>
                            {
                                this.state.repositories
                                    .map((r : SharedRepository) =>
                                        <RepositoryCard key={r.repo}
                                                        link={`/${r.provider}/${r.id}/${r.owner}/${r.repo}/${this.getSharedPathType(r.path)}/${this.getPreferredSha(r)}${this.getAdditionalPath(r.path)}?token=${this.props.token}`}
                                                        name={`${r.repo}` + (!!r.path ? `/${r.path}` : '')}
                                                        downloadable={r.downloadAllowed}
                                                        description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                        provider={r.provider}></RepositoryCard>
                                    )
                            }
                        </List>
                    </div>
                </div>
            </ContentPanel>
        )
    }
    getPreferredSha(r: SharedRepository): string {
        const master = r.branches.find(x=>x.name == 'master');
        if(master != undefined) {
            return master.name;
        }
        else {
            const def = r.branches.find(x=>x.name == 'default');
            if(def != undefined) {
                return def.name;
            }
            else {
                return r.branches[0].name;
            }
        }
    }
    renderTokenValidity() {
        if(this.state.tokenValid == undefined) {
            return <p>Checking Token ... </p>
        } else if (this.state.tokenValid) {
            return null;
        } else {
            return <p>Token expired or invalid, please contact your source </p>
        }
    }
}