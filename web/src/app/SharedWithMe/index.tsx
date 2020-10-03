import { Token, TokenRepo, compareTokens, prettyRemainingTime, prettyRemainingTimeOfToken } from 'models/Tokens';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import styles from './style.scss';
import ContentPanel from 'components/ContentPanel';
import LocalStorageDictionary from 'util/LocalStorageDictionary';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { Button, Grid } from '@material-ui/core';
import ConfirmDialog from 'components/ConfirmDialog';

export interface IProps extends RouteComponentProps<any> {
}

interface IState {
    tokens: Token[];
    confirmForget?: Token;
}

export default class SharedWithMe extends React.Component<IProps, IState> {
    state: IState = {
        tokens: [],
    }
    constructor(props: IProps) {
        super(props)
    }
    componentDidMount() {
        const allTokens = new LocalStorageDictionary<Token>('alltokens');

        this.state.tokens = allTokens.getAll().filter(x => {
            const d = x.tokenExp == undefined ? undefined : new Date(x.tokenExp);
            const canStay = d == undefined || d.getTime() > new Date().getTime();

            if (!canStay)
                allTokens.remove(x.token);

            return canStay;
        }).sort(compareTokens);

        this.setState(this.state);
    }
    forget(token: string) {
        const toForget = this.state.tokens.findIndex(x => x.token == token);
        if (toForget > -1) {
            this.state.tokens.splice(toForget, 1);

            const allTokens = new LocalStorageDictionary<Token>('alltokens');
            allTokens.remove(token);
            
            this.setState(this.state);
        }
    }
    renderTokenHeader(token: Token): string {
        if (!!token.author) {
            return `${token.author}'s [${!!token.customName ? token.customName : token.token}]`
        } else {
            return `[${token.token}]`
        }
    }
    render() {
        return (
            <div id={styles.sharedWithMe}>
                <ContentPanel background='light'>
                    <Grid item container direction='column'>
                        <h2>Links shared with you</h2>
                        {this.state.tokens.length == 0 ? <p>You have no tokens yet!</p> : null}
                        <List>
                            {
                                this.state.tokens.map((token: Token) =>
                                    [
                                        <ListItem button key={token.token} component={Link} to={`/share/${token.token}`} >
                                            <Grid container direction='column' justify='center' alignItems='flex-start'>
                                                <Grid item container direction='row' className={styles.repoHeader}>
                                                    <ListItemText primary={this.renderTokenHeader(token)} secondary={token.tokenExp != undefined ? 'Expires in: ' + prettyRemainingTimeOfToken(token) : ''} />
                                                    <Button variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); e.preventDefault(); this.setState({confirmForget: token}) }}>Forget</Button>
                                                </Grid>
                                                <Grid item container direction='row' className={styles.repoList}>
                                                    {
                                                        token.repositories.length == 0 ?
                                                            <Grid item className={styles.repoItem} component={ListItemText} primary="Not yet visited" /> :
                                                            token.repositories.map((r: TokenRepo) => (
                                                                <Grid item className={styles.repoItem}
                                                                    key={`${r.provider}/${r.owner}/${r.name}`}
                                                                    component={ListItemText}
                                                                    primary={`\[${r.provider}\]/${r.owner}/${r.name}${!!r.path ? '/'+r.path : ''}`} />
                                                            ))
                                                    }
                                                </Grid>
                                            </Grid>
                                        </ListItem>
                                    ])
                            }
                        </List>
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