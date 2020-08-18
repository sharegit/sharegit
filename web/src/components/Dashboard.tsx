import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { BaseState } from '../models/BaseComponent';
import API, { SharedRepository } from '../models/API';
import { List, Accordion, Icon, AccordionTitleProps, Button, Modal } from 'semantic-ui-react';
import RepositoryCard from './RepositoryCard';
import NewTokenCreation from './NewTokenCreation';
import config from '../config';

interface IState extends BaseState {
    name: string;
    sharedTokens: string[];
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
        repositories: []
    }
    constructor(props: IProps) {
        super(props);
    }
    async componentDidMount() {
        if (localStorage.getItem('OAuthJWT')) {
            const essentialsRequest = API.fetchDashboardEssential(this.state.cancelToken)
            const tokensRequest = API.getSharedTokens(this.state.cancelToken)

            const essentials = await essentialsRequest;
            this.state.name = essentials.name;
            this.setState(this.state);

            const tokens = await tokensRequest;
            this.state.sharedTokens = tokens;
            tokens.forEach((_, index) => {
                this.state.repositories[index] = []
            });
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
        
        if(this.state.activeTokenIndex >= 0) {
            if(this.state.repositories[this.state.activeTokenIndex].length == 0) {
                const index = this.state.activeTokenIndex

                const repositories = await API.getSharedRepositories(this.state.sharedTokens[index], this.state.cancelToken)
                this.state.repositories[index] = repositories;
                this.setState(this.state);
            }
        }
        this.setState(this.state)
    }
    addToken(token: string) {
        this.state.sharedTokens.push(token);
        this.state.repositories[this.state.sharedTokens.length - 1] = []
        this.setState(this.state);
    }
    async deleteToken(token: string) {
        
        await API.deleteToken(token, this.state.cancelToken)
        const index = this.state.sharedTokens.indexOf(token, 0);
        if (index > -1) {
            this.state.activeTokenIndex = -1;
            this.state.sharedTokens.splice(index, 1);
            this.setState(this.state);
        }
    }
    render() {
        return (
            <div>
                <h2>
                    Dashboard
                </h2>
                <p>Hello {this.state.name}</p>
               <NewTokenCreation tokenCreatedCallback={this.addToken.bind(this)}></NewTokenCreation>
                <Accordion fluid styled>
                    {
                        this.state.sharedTokens
                            .map((token : string, index: number) => 
                                <div key={token}>
                                    <Accordion.Title
                                        active={this.state.activeTokenIndex == index}
                                        index={index}
                                        onClick={this.handleClick.bind(this)}>
                                        <Icon name='dropdown' />
                                        {token}
                                    </Accordion.Title>
                                    <Accordion.Content active={this.state.activeTokenIndex == index}>
                                        <Button onClick={() =>{
                                            navigator.clipboard.writeText(`${config.share_uri}/${token}`);
                                        }}>Copy link</Button>
                                        <Button onClick={()=>{
                                            this.deleteToken(token)
                                        }}>Delete token</Button>
                                        <h3>Repositories shared with this token:</h3>
                                        <List divided relaxed>
                                            {
                                                this.state.repositories[index]
                                                    .map((r : SharedRepository) =>
                                                        <RepositoryCard key={`${r.repo}_${token}`}
                                                                        link={`/repo/${r.owner}/${r.repo}/tree/master/`}
                                                                        name={r.repo}
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
        )
    }
}
