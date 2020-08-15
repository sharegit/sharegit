import React from 'react'
import { RouteComponentProps } from 'react-router';
import { List } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/SharedWithMe.scss';

export interface IProps extends RouteComponentProps<any> {
}

interface IState {
    tokens: string[];
}

export default class SharedWithMe extends React.Component<IProps, IState> {
    state: IState = {
        tokens: [],
    }
    constructor(props: IProps) {
        super(props)
    }
    componentDidMount() {
        let allTokens = localStorage.getItem("alltokens");
        console.log(allTokens)
        if(allTokens != null) {
            this.state.tokens = JSON.parse(allTokens);
            console.log(this.state.tokens)
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
                            .map((token : string) =>
                            <List.Item key={token}>
                                <List.Content>
                                    <List.Header>
                                        <Link to={`/share/${token}`}>{token}</Link>
                                    </List.Header>
                                </List.Content>
                            </List.Item>
                            )
                    }
                </List>
            </div>
        )
    }
}