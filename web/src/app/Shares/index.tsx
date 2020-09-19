import React from 'react';
import ContentPanel from 'components/ContentPanel';
import { BaseState } from 'models/BaseState';
import API, { SharedToken, SharedRepository } from 'models/API';
import { Accordion, AccordionTitleProps, Icon, Button, List } from 'semantic-ui-react';
import { RouteComponentProps, Link } from 'react-router-dom';
import config from 'config';
import RepositoryCard from 'app/SharedLanding/RepositoryCard';
import printDate from 'util/Date';
import { getSharedPathType, getAdditionalPath, getPreferredSha } from 'models/Tokens';
import ConfirmDialog from 'components/ConfirmDialog';

interface IState extends BaseState {
    name: string;
    sharedTokens: SharedToken[];
    activeTokenIndex: number;
    repositories: { [K in number]: SharedRepository[] };
    confirmDeletion?: SharedToken;
}

export interface IProps  extends RouteComponentProps<any> {
}

export default class Shares extends React.Component<IProps, IState>  {
    constructor(props: IProps) {
        super(props);
        this.state = {
            cancelToken: API.aquireNewCancelToken(),
            name: '',
            sharedTokens: [],
            activeTokenIndex: -1,
            repositories: []
        }
    }
    async componentDidMount() {
        const tokensRequest = API.getSharedTokens(this.state.cancelToken)

        const tokens = await tokensRequest;
        this.setState({
            sharedTokens: tokens,
            repositories: tokens.map(x => [])
        })
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel()
    }

    async handleClick(event: React.MouseEvent<HTMLDivElement>, data: AccordionTitleProps): Promise<void> {
        const newIndex = data.index as number
        this.setState({
            activeTokenIndex: this.state.activeTokenIndex == newIndex ? -1 : newIndex
        })
        
        if(newIndex >= 0) {
            if(this.state.repositories[newIndex].length == 0) {
                try {
                    const repositories = await API.getSharedRepositories(this.state.sharedTokens[newIndex].token, this.state.cancelToken)
                    this.state.repositories[newIndex] = repositories.repositories;
                    this.setState({
                        repositories: this.state.repositories
                    })
                } catch (e) {
                    if (!API.wasCancelled(e)) {
                        throw e;
                    }
                }
            }
        }
    }
    addToken(token: SharedToken) {
        this.state.sharedTokens.push(token);
        this.state.repositories[this.state.sharedTokens.length - 1] = []
        this.setState({
            sharedTokens: this.state.sharedTokens,
            repositories: this.state.repositories
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
    render() {
        return(
            <ContentPanel background='light'>
                <div>
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
                                            {!!token.customName ? token.customName : token.token}
                                            { token. expireDate != 0 &&
                                                `${token.expireDate < new Date().getTime() / 1000 / 60 ? '(Expired at ' : '(Expires at '}${printDate(new Date(token.expireDate * 60 * 1000))}`}
                                        </Accordion.Title>
                                        <Accordion.Content active={this.state.activeTokenIndex == index}>
                                            <Button onClick={() =>{
                                                navigator.clipboard.writeText(`${config.share_uri}/${token.token}`);
                                            }}>Copy link</Button>
                                             <Button>
                                                <Link target='_blank' to={`/share/${token.token}`}>
                                                    Open link
                                                </Link>
                                            </Button>
                                            <Button onClick={()=>this.setState({confirmDeletion: token})}>Delete token</Button>
                                            <h3>Repositories shared with this token:</h3>
                                            <List divided relaxed>
                                                {
                                                    this.state.repositories[index]
                                                        .map((r : SharedRepository) =>
                                                            <RepositoryCard key={`${r.repo}_${token.token}`}
                                                                            target='_blank'
                                                                            link={`/${r.provider}/${r.id}/${r.owner}/${r.repo}/${getSharedPathType(r.path)}/${getPreferredSha(r.branches)}${getAdditionalPath(r.path)}?token=${token.token}`}
                                                                            name={`${r.repo}` + (!!r.path ? `/${r.path}` : '')}
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
                </div>
            </ContentPanel>
        );
    }
}