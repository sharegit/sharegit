import React from 'react';
import ContentPanel from 'components/ContentPanel';
import { BaseState } from 'models/BaseState';
import API, { SharedToken, SharedRepository, Analytic } from 'models/API';
import { RouteComponentProps, Link } from 'react-router-dom';
import config from 'config';
import RepositoryCard from 'app/SharedLanding/RepositoryCard';
import printDate from 'util/Date';
import { getSharedPathType, getAdditionalPath, getPreferredSha } from 'models/Tokens';
import ConfirmDialog from 'components/ConfirmDialog';
import ExpandIcon from 'assets/icons/expand.svg';
import { Button, Accordion, AccordionSummary, AccordionDetails, List, Grid, Card, CardContent, CardActions, Typography, InputBase, TextField } from '@material-ui/core';
import CustomIcon from 'components/CustomIcon';
import style from './style.scss';
import Dictionary from 'util/Dictionary';
import Loading from 'components/Loading';
import DismissableMessage from 'components/DismissableMessage';



interface IState extends BaseState {
    name: string;
    sharedTokens: SharedToken[];
    activeTokenIndex: number;
    confirmDeletion?: SharedToken;
    filter: string;
    analytics: Dictionary<Analytic>;
    loaded: boolean;

    newTokenAdded?: string;
    popupMessage?: string;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Shares extends React.Component<IProps, IState>  {
    constructor(props: IProps) {
        super(props);
        const state = props.location.state;
        const newToken = state == undefined ? undefined :  (state as any).newToken as SharedToken;
        const newTokenToken = newToken == undefined ? undefined : newToken.token;
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            name: '',
            sharedTokens: [],
            activeTokenIndex: -1,
            filter: '',
            analytics: new Dictionary<Analytic>(),
            loaded: false,
            newTokenAdded: newTokenToken,
            popupMessage: newToken == undefined ? undefined : 
                `Token ${newToken.customName} successfully created, link copied to the clipboard.`
        }

        window.history.replaceState(null, '')
    }
    async componentDidMount() {
        const tokensRequest = API.getSharedTokens(this.state.cancelToken)
        const essentialsRequest = API.fetchDashboardEssential(this.state.cancelToken)
        const analyticsRequest = API.getAnalytics(this.state.cancelToken)

        const essentials = await essentialsRequest;
        const tokens = await tokensRequest;
        const analytics = await analyticsRequest;

        analytics.analytics.forEach( x => {
            if (tokens.some(t=>x.token == t.token))
                this.state.analytics.put(x.token, x);
        })
                
        this.setState({
            sharedTokens: tokens.sort(this.sortTokensBy.bind(this)),
            name: essentials.name,
            analytics: this.state.analytics,
            loaded: true
        })
    }
    sortTokensBy(a: SharedToken, b: SharedToken): number {
        if (this.isTokenExpired(b) && !this.isTokenExpired(a))
            return -1;
        if (this.isTokenExpired(a) && !this.isTokenExpired(b))
            return +1;
        
        return a.customName.localeCompare(b.customName);
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }

    addToken(token: SharedToken) {
        this.state.sharedTokens.push(token);
        this.setState({
            sharedTokens: this.state.sharedTokens
        });
    }
    async deleteToken(token: string) {
        try {
            await API.deleteToken(token, this.state.cancelToken)
            const index = this.state.sharedTokens.findIndex(x => x.token == token, 0);
            if (index > -1) {
                this.state.sharedTokens.splice(index, 1);
                this.setState({
                    activeTokenIndex: -1,
                    sharedTokens: this.state.sharedTokens
                })
            }
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    searched(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        const newValue = event.target.value;
        this.setState({
            filter: newValue
        })
    }
    filter(token: SharedToken) {
        if (this.state.filter == '')
            return true;

        const filter = this.state.filter.toLowerCase();

        if (token.repositories.some(x=>x.repo.toLowerCase().includes(filter) || x.provider.toLowerCase().includes(filter)))
            return true;

        if (token.customName.toLowerCase().includes(filter))
            return true;

        return false;
    }
    constructAnalytics(token: string) {
        const anal = this.state.analytics.get(token);
        if(anal != undefined)
            return <span className={style.small}>Unique Views: {anal.uniquePageViews}, Clicks: {anal.pageViews}</span>

        return null;
    }
    isTokenExpired(token: SharedToken) {
        if (token.expireDate > 0)
            return token.expireDate < new Date().getTime() / 1000 / 60;
        
        return false;
    }
    render() {
        return(
            <div>
                <ContentPanel background='light'>
                    {this.state.popupMessage == undefined ? null :
                            <DismissableMessage style='positive'
                            headerMessage={this.state.popupMessage}
                            active
                            onClose={() => this.setState({popupMessage: undefined})} /> }
                    <Grid item container direction='column'>
                        <h2>You are logged in as {this.state.name}</h2>
                    <Button component={Link} to='/create'>Create new Token</Button>
                        <h2>Your shares</h2>
                    <TextField
                        label={'Search'}
                        onChange={this.searched.bind(this)}
                        placeholder="Search repository, link title or provider"
                        inputProps={{ 'aria-label': 'search' }}/>
                    <Grid item container justify='center' alignItems='center'>
                        {
                            !this.state.loaded ? <Loading />
                        :   this.state.sharedTokens
                                .filter(this.filter.bind(this))
                                .map((token : SharedToken) => 
                                    <Card
                                        key={token.token}
                                        className={`${style.shareCard} ${this.isTokenExpired(token) ? style.disabled : style.enabled} ${this.state.newTokenAdded == token.token ? style.highlighted : ''}`}
                                        onMouseEnter={() => {
                                            if (token.token == this.state.newTokenAdded)
                                                this.setState({
                                                    newTokenAdded: undefined
                                                })
                                        }}>
                                        <CardContent>
                                            <Typography className={style.header}>
                                                {!!token.customName ? token.customName : token.token}
                                            </Typography>
                                            {this.constructAnalytics(token.token)}
                                            <hr />
                                            { token. expireDate != 0 &&
                                                <div className={style.small}>
                                                    {this.isTokenExpired(token) ? '(Expired at ' : '(Expires at '}
                                                    {printDate(new Date(token.expireDate * 60 * 1000))}
                                                </div> }
                                            
                                            <Typography className={style.header}>Repositories:</Typography>
                                            <ul className={`${style.small} ${style.repos}`}>
                                                {
                                                    token.repositories.slice(0, 15).map((r: SharedRepository) => 
                                                        <li className={style.repo}>{r.repo}, </li>
                                                    ) 
                                                }
                                                {token.repositories.length > 15 &&
                                                        <li className={style.repo}>{token.repositories.length - 15} more ...</li>}
                                            </ul>
                                        </CardContent>
                                        <CardActions>
                                            <Button onClick={() =>{
                                                navigator.clipboard.writeText(`${config.share_uri}/${token.token}`);
                                            }}>Copy link</Button>
                                            <Button component={Link} target='__blank' to={`/share/${token.token}`}>
                                                Open link
                                            </Button>
                                            <Button onClick={()=>this.setState({confirmDeletion: token})}>Delete token</Button>
                                        </CardActions>

                                    </Card>
                                )
                        }
                        </Grid>
                    <ConfirmDialog
                        open={this.state.confirmDeletion != undefined}
                        onCancel={() => this.setState({confirmDeletion: undefined})}
                        onConfirm={async () => {
                            if(this.state.confirmDeletion == undefined)
                                throw new Error('Confirming token cannot be undefined here.');

                            await this.deleteToken(this.state.confirmDeletion.token);
                            this.setState({confirmDeletion: undefined});
                        }}
                        header='Link deletion'
                        content={
                            <div>
                                <p>Deleting link: {this.state.confirmDeletion != undefined
                                               && (this.state.confirmDeletion!.customName != undefined ? this.state.confirmDeletion!.customName : this.state.confirmDeletion!.token)}</p>
                                I understand this this action is irreversible and will result in the deletion of this link. Noone with this link will be able to access any of the repositories contained within this link. This process could take up to 1 hour, due to caching.
                            </div>}
                        cancelLabel='Cancel'
                        confirmLabel="Delete link!">
                    </ConfirmDialog>
                    </Grid>
                </ContentPanel>
            </div>
        );
    }
}


// <AccordionDetails>
// <Grid container spacing={3}>
//     <Grid item xs={12}>
        
//     </Grid>
//     <Grid item xs={12}>
//         <h3>Repositories shared with this token:</h3>
//     </Grid>
//     <Grid item xs={12}>
//         <List >
//             {
//                 this.state.repositories[index]
//                     .map((r : SharedRepository) =>
//                         <RepositoryCard key={`${r.repo}_${token.token}`}
//                                         target='_blank'
//                                         link={`/${r.provider}/${r.id}/${r.owner}/${r.repo}/${getSharedPathType(r.path)}/${getPreferredSha(r.branches)}${getAdditionalPath(r.path)}?token=${token.token}`}
//                                         name={`${r.repo}` + (!!r.path ? `/${r.path}` : '')}
//                                         downloadable={r.downloadAllowed}
//                                         description={!!r.description ? r.description : "No description, website, or topics provided."}
//                                         provider={r.provider}></RepositoryCard>
//                     )
//             }
//         </List>
//     </Grid>
// </Grid>
// </AccordionDetails>