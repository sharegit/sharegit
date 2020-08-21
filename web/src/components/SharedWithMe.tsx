import React from 'react'
import { RouteComponentProps } from 'react-router';
import { List, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/SharedWithMe.scss';
import { Token, TokenRepo } from '../models/Tokens';

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
                                        <Link to={`/share/${token.token}`}>{`${token.author}'s [${token.token}]`}</Link>
                                    </List.Header>
                                    <List.Description>
                                        {token.repositories.map((r:TokenRepo) => (
                                            <span key={`${r.provider}/${r.owner}/${r.name}`}>
                                                {`${r.owner}/${r.name}`}
                                            </span>
                                        ))}
                                    </List.Description>
                                    <Button onClick={(e, d) => {
                                        this.forget(token.token)
                                    }}>Forget</Button>
                                </List.Content>
                            </List.Item>
                            )
                    }
                </List>
            </div>
        )
    }
}