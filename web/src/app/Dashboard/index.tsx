import RepositoryCard from 'app/SharedLanding/RepositoryCard';
import ContentPanel from 'components/ContentPanel';
import config from 'config';
import API, { Analytic, SharedRepository, SharedToken } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Accordion, AccordionTitleProps, Button, Icon, List, Segment } from 'semantic-ui-react';
import style from './style.scss';

interface IState extends BaseState {
    name: string;
    sharedTokens: SharedToken[];
    analytics: Analytic[];
    activeTokenIndex: number;
    repositories: { [K in number]: SharedRepository[] };
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Dashboard extends React.Component<IProps, IState>  {
    state: IState = {
        cancelToken: API.aquireNewCancelToken(),
        name: '',
        sharedTokens: [],
        activeTokenIndex: -1,
        repositories: [],
        analytics: []
    }
    constructor(props: IProps) {
        super(props);
    }
    async componentDidMount() {
        if (localStorage.getItem('OAuthJWT')) {
            const essentialsRequest = API.fetchDashboardEssential(this.state.cancelToken)
            const tokensRequest = API.getSharedTokens(this.state.cancelToken)
            const analyticsRequest = API.getAnalytics(this.state.cancelToken)

            const essentials = await essentialsRequest;
            this.state.name = essentials.name;
            this.setState(this.state);

            const tokens = await tokensRequest;
            this.state.sharedTokens = tokens;
            tokens.forEach((_, index) => {
                this.state.repositories[index] = []
            });

            const analytics = await analyticsRequest;
            this.state.analytics = analytics.analytics;
            this.setState(this.state);
        } else {
            this.props.history.push(`/auth`);
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }
    async handleClick(event: React.MouseEvent<HTMLDivElement>, data: AccordionTitleProps): Promise<void> {
        const newIndex = data.index as number
        if(this.state.activeTokenIndex == newIndex)
            this.state.activeTokenIndex = -1;
        else 
            this.state.activeTokenIndex = newIndex;
        this.setState(this.state)
        
        if(this.state.activeTokenIndex >= 0) {
            if(this.state.repositories[this.state.activeTokenIndex].length == 0) {
                const index = this.state.activeTokenIndex

                const repositories = await API.getSharedRepositories(this.state.sharedTokens[index].token, this.state.cancelToken)
                this.state.repositories[index] = repositories.repositories;
                this.setState(this.state);
            }
        }
    }
    addToken(token: SharedToken) {
        this.state.sharedTokens.push(token);
        this.state.repositories[this.state.sharedTokens.length - 1] = []
        this.setState(this.state);
    }
    async deleteToken(token: SharedToken) {

        await API.deleteToken(token.token, this.state.cancelToken)
        const index = this.state.sharedTokens.indexOf(token, 0);
        if (index > -1) {
            this.state.activeTokenIndex = -1;
            this.state.sharedTokens.splice(index, 1);
            this.setState(this.state);
        }
    }
    render() {
        return (
            <ContentPanel background='light'>
                <div id={style.dashboard}>
                    <h2>
                        Dashboard
                    </h2>
                    <p>Hello {this.state.name}</p>
                    <Segment>
                        <h2>Analytics</h2>
                        <ul>
                            {this.state.analytics.map(x=> (
                                <li key={x.token}>{x.token}: unique ({x.uniquePageViews}) | clicks ({x.pageViews})</li>
                            ))}
                        </ul>
                    </Segment>
                    <Button><Link to='/create'>Create new Token</Link></Button>
                    <Accordion fluid styled>
                        {
                            this.state.sharedTokens
                                .map((token : SharedToken, index: number) => 
                                    <div key={token.token}>
                                        <Accordion.Title
                                            active={this.state.activeTokenIndex == index}
                                            index={index}
                                            onClick={async (event, data) => {
                                                await this.handleClick(event, data)
                                            }}>
                                            <Icon name='dropdown' />
                                            {token.token}
                                        </Accordion.Title>
                                        <Accordion.Content active={this.state.activeTokenIndex == index}>
                                            <Button onClick={() =>{
                                                navigator.clipboard.writeText(`${config.share_uri}/${token.token}`);
                                            }}>Copy link</Button>
                                            <Button onClick={()=>{
                                                this.deleteToken(token)
                                            }}>Delete token</Button>
                                            <h3>Repositories shared with this token:</h3>
                                            <List divided relaxed>
                                                {
                                                    this.state.repositories[index]
                                                        .map((r : SharedRepository) =>
                                                            <RepositoryCard key={`${r.repo}_${token.token}`}
                                                                            link={``}
                                                                            name={r.repo}
                                                                            downloadable={r.downloadAllowed}
                                                                            description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                                            provider={r.provider}></RepositoryCard>
                                                        )
                                                }
                                            </List>
                                        </Accordion.Content>
                                    </div>
                                )
                        }
                    </Accordion>
                </div>
            </ContentPanel>
        )
    }
}
