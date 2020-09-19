import { Token, TokenRepo } from 'models/Tokens';
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
import { Button } from '@material-ui/core';

export interface IProps extends RouteComponentProps<any> {
}

interface IState {
    tokens: Token[];
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
        });

        this.setState(this.state);
    }
    forget(token: string) {
        const toForget = this.state.tokens.findIndex(x => x.token == token);
        if (toForget > -1) {
            this.state.tokens.splice(toForget, 1);

            const tokens = JSON.stringify(this.state.tokens);
            localStorage.setItem("alltokens", tokens);

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
            <ContentPanel background='light'>
                <div id={styles.sharedWithMe}>
                    <h2>Tokens shared with you</h2>
                    {this.state.tokens.length == 0 ? <p>You have no tokens yet!</p> : null}
                    <List>
                        {
                            this.state.tokens.map((token: Token) =>
                                [
                                    <ListItem button key={token.token} component={Link} to={`/share/${token.token}`} >
                                        <ListItemText primary={this.renderTokenHeader(token)} secondary={token.tokenExp != undefined ? 'Expires on: ' + token.tokenExp : ''} />
                                        <List disablePadding dense >
                                            {
                                                token.repositories.length == 0 ?
                                                    <ListItem component={ListItemText} primary="Not yet visited" /> :
                                                    token.repositories.map((r: TokenRepo) => (
                                                        <ListItem
                                                            key={`${r.provider}/${r.owner}/${r.name}`}
                                                            component={ListItemText}
                                                            primary={`\[${r.provider}\]/${r.owner}/${r.name}`} />
                                                    ))
                                            }
                                        </List>
                                        <ListItemSecondaryAction>
                                            <Button variant="contained" color="primary" onClick={() => { this.forget(token.token) }}>Forget</Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ])
                        }
                    </List>
                </div>
            </ContentPanel >
        )
    }
}