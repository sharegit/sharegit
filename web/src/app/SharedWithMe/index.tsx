import { Token, TokenRepo, compareTokens, prettyRemainingTime, prettyRemainingTimeOfToken } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { Button, Grid, Card, Tooltip } from '@material-ui/core';
import ConfirmDialog from 'components/ConfirmDialog';
import CustomIcon from 'components/CustomIcon';
import GetAppIcon from 'assets/icons/get-app.svg';
import GlobalEvent from 'util/GlobalEvent';
import { Link } from 'react-router-dom';
import printDate from 'util/Date';

export interface IProps extends RouteComponentProps<any> {
}

interface IState {
    tokens: Token[];
    confirmForget?: Token;
    sharedListUpdated: GlobalEvent;
}

export default class SharedWithMe extends React.Component<IProps, IState> {
    state: IState = {
        tokens: [],
        sharedListUpdated: new GlobalEvent('sharedListUpdated')
    }
    constructor(props: IProps) {
        super(props)
    }
    componentDidMount() {
        const allTokens = new LocalStorageDictionary<Token>('alltokens');

        let anyRemoved = false;

        this.state.tokens = allTokens.getAll().filter(x => {
            const d = x.tokenExp == undefined ? undefined : new Date(x.tokenExp);
            const canStay = d == undefined || d.getTime() > new Date().getTime();

            if (!canStay) {
                allTokens.remove(x.token);
                anyRemoved = true;
            }

            return canStay;
        }).sort(compareTokens);

        if (anyRemoved) {
            this.state.sharedListUpdated.dispatch();
        }

        this.setState(this.state);
    }
    forget(token: string) {
        const toForget = this.state.tokens.findIndex(x => x.token == token);
        if (toForget > -1) {
            this.state.tokens.splice(toForget, 1);

            const allTokens = new LocalStorageDictionary<Token>('alltokens');
            allTokens.remove(token);

            this.state.sharedListUpdated.dispatch();
            
            this.setState(this.state);
        }
    }
    renderTokenHeader(token: Token) {
        if (!!token.author) {
            return [<div key='author' className={styles.author}>{token.author}'s</div>,
                    <div key='name' className={styles.name}>{!!token.customName ? token.customName : token.token}</div>].concat( 
                        token.tokenExp != undefined ? <div key='exp' className={styles.exp}>
                            {'Expires in '}
                            <Tooltip title={printDate(token.tokenExp)}>
                                <span>
                                    {prettyRemainingTime(token.tokenExp)}
                                </span>
                            </Tooltip>
                        </div> : <span key='exp' />
                    )
        } else {
            return token.token
        }
    }
    constructRepositoryLabel(r: TokenRepo) {
        const str = `${r.name}${!!r.path ? '/'+r.path : ''}`;

        if (r.downloadable)
            return [<CustomIcon key='icon' src={GetAppIcon} />,<span key='rep'>{str}</span>]
        else
            return str
    }
    render() {
        return (
            <div id={styles.sharedWithMe}>
                <ContentPanel background='light'>
                    <Grid item container direction='column'>
                        <h2>Links shared with you</h2>
                        {this.state.tokens.length == 0 ? <p>You have no tokens yet!</p> : null}
                       <Grid item container justify='center' alignItems='center'>
                            {
                                this.state.tokens.map((token: Token) =>
                                    [
                                        <Link key={token.token} to={`/share/${token.token}`}>
                                            <Card  className={styles.sharedLink}>
                                                <Grid container direction='column' justify='center' alignItems='flex-start'>
                                                    {this.renderTokenHeader(token)}
                                                    <hr />
                                                    <Button className={styles.forget} onClick={(e) => { e.stopPropagation(); e.preventDefault(); this.setState({confirmForget: token}) }}>Forget</Button>
                                                    
                                                    <ul className={styles.repoList}>
                                                        {
                                                            token.repositories.length == 0 ?
                                                                <li className={styles.repoItem} >Not yet visited</li>:
                                                                token.repositories.slice(0, 15).map((r: TokenRepo) => (
                                                                    <li className={styles.repoItem}
                                                                        key={`${r.provider}/${r.owner}/${r.name}`}
                                                                        >{this.constructRepositoryLabel(r)}</li>
                                                                ))
                                                        }
                                                        {token.repositories.length > 15 && 
                                                            <li className={styles.repoItem}>{token.repositories.length - 15} more ...</li>}
                                                    </ul>
                                                </Grid>
                                            </Card>
                                        </Link>
                                    ])
                            }
                        </Grid>
                        <ConfirmDialog
                            open={this.state.confirmForget != undefined}
                            onCancel={() => this.setState({confirmForget: undefined})}
                            onConfirm={async () => {
                                if(this.state.confirmForget == undefined)
                                    throw new Error('Confirming token cannot be undefined here.');

                                this.forget(this.state.confirmForget.token);
                                this.setState({confirmForget: undefined});
                            }}
                            header='Forget link?'
                            content={
                                <div>
                                    <p>Forgetting link: {this.state.confirmForget != undefined
                                                    && (this.state.confirmForget!.customName != undefined ? this.state.confirmForget!.customName : this.state.confirmForget!.token)}</p>
                                    I would like to forget this link and I understand that this action is irreversible.
                                </div>}
                            cancelLabel='Cancel'
                            confirmLabel="Forget link">
                        </ConfirmDialog>
                    </Grid>
                </ContentPanel>
            </div>
        )
    }
}