import API, { SharedRepository } from 'models/API';
import { BaseState } from 'models/BaseState';
import { Token, getSharedPathType, getAdditionalPath, getPreferredSha, prettyRemainingTime } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import RepositoryCard from './RepositoryCard';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import { List, Grid } from '@material-ui/core';
import Loading from 'components/Loading';
import * as ReactDOM from 'react-dom'
import GlobalEvent from 'util/GlobalEvent';

export interface IProps extends RouteComponentProps<any> {
    token: string;
    onLinkVisited: () => void;
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

            const repositories = sharedRepositories.repositories.sort((a, b)=>a.repo.localeCompare(b.repo));
            
            this.state.tokenValid = true;
            this.state.repositories = repositories;
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
                repositories: repositories.map(x=>({
                    name: x.repo,
                    owner: x.owner,
                    provider: x.provider,
                    downloadable: x.downloadAllowed,
                    path: x.path
                })),
                firstOpenDate: new Date()
            })

            const event = new GlobalEvent('sharedListUpdated');
            event.dispatch();
        } catch(error) {
            this.state.tokenValid = false;
            this.setState(this.state);
            if (!API.wasCancelled(error)) {
                throw error;
            }
        }
    }

    render() {
        return (
            <div id={styles.sharelandingcontainer}>
                <ContentPanel background='light'>
                    <Grid direction='column' item container>
                        <h2>{this.state.customName}</h2>
                        <div id={styles.landingHeader}>
                            <div id={styles.availableReposText}>
                                <h3>Repositories shared with you</h3>
                            </div>
                            <div id={styles.authorText}>
                                <p> <b>Shared by:</b> <i>{this.state.author}</i> <br />
                                {this.state.authorWebsite != undefined && this.state.authorWebsite.length > 0 &&
                                    <span><b>Website:</b><a href={!!this.state.authorWebsite ? this.state.authorWebsite : ''}><i>{this.state.authorWebsite}</i></a></span>}
                                </p>
                            </div>
                            <div className="clear"></div>
                        </div>
                        {this.state.tokenExp != undefined && 
                            'This link will expire in ' + prettyRemainingTime(this.state.tokenExp)}
                        {!!this.state.authorBio ? <p>The following Biography was provided by {this.state.author}: <br />{this.state.authorBio}</p> : null}
                        <div id={styles.tokenChecker}>
                            {this.renderTokenValidity()}
                        </div>
                        <Grid item container direction='row' justify='center' alignItems='stretch' className={styles.grid}>
                            {
                                this.state.repositories
                                    .map((r : SharedRepository) =>
                                        <RepositoryCard key={r.repo}
                                                        link={`/${r.provider}/${r.id}/${r.owner}/${r.repo}/${getSharedPathType(r.path)}/${getPreferredSha(r.branches)}${getAdditionalPath(r.path)}?token=${this.props.token}`}
                                                        name={`${r.repo}` + (!!r.path ? `/${r.path}` : '')}
                                                        downloadable={r.downloadAllowed}
                                                        description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                        provider={r.provider}></RepositoryCard>
                                    )
                            }
                        </Grid>
                    </Grid>
                </ContentPanel>
            </div>
        )
    }
    
    renderTokenValidity() {
        if(this.state.tokenValid == undefined) {
            return <Loading />
        } else if (this.state.tokenValid) {
            return null;
        } else {
            return <p>Token expired or invalid, please contact your source </p>
        }
    }
}