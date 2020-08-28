import React from 'react'
import { RouteComponentProps } from 'react-router';
import { List, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/SharedWithMe.scss';
import { Token, TokenRepo } from '../models/Tokens';
import { Tokenizer } from 'marked';

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
        const allTokensStr = localStorage.getItem("alltokens");
        if(allTokensStr != null) {
            this.state.tokens = JSON.parse(allTokensStr);
            this.setState(this.state);
        }
    }
    forget(token: string) {
        const toForget = this.state.tokens.findIndex(x=>x.token == token);
        if(toForget > -1) {
            this.state.tokens.splice(toForget, 1);

            const tokens = JSON.stringify(this.state.tokens);
            localStorage.setItem("alltokens", tokens);

            this.setState(this.state);
        }
    }
    renderTokenHeader(token: Token): string {
        if(!!token.author) {
            return `${token.author}'s [${token.token}]`
        } else {
            return `[${token.token}]`
        }
    }
    render() {
        return (
            <div id={styles.sharedWithMe}>
                <h2>Tokens shared with you</h2>
                {this.state.tokens.length == 0 ?
                    <p>You have no tokens yet!</p>
                : null}
                <List divided relaxed>
                    {
                        this.state.tokens
                            .map((token : Token) =>
                            <List.Item key={token.token}>
                                <List.Content>
                                    <List.Header>
                                        <Link to={`/share/${token.token}`}>{this.renderTokenHeader(token)}</Link>
                                    </List.Header>
                                    <List.Description id={styles.list}>
                                        {token.repositories.length == 0 ?
                                        <p>Not yet visited</p>
                                    :
                                        token.repositories.map((r:TokenRepo) => (
                                            <span key={`${r.provider}/${r.owner}/${r.name}`}>
                                                {`\[${r.provider}\]/${r.owner}/${r.name}`}
                                            </span>
                                        ))}
                                    </List.Description>
                                    <Button secondary onClick={(e, d) => {
                                        this.forget(token.token)
                                    }}>Forget</Button>

                                    <div className="clear"></div>
                                </List.Content>
                            </List.Item>
                            )
                    }
                </List>
            </div>
        )
    }
}