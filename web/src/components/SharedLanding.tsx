import React from 'react'
import { RouteComponentProps } from 'react-router';
import API, { SharedRepository } from '../models/API';
import { BaseState } from '../models/BaseComponent';
import { List } from 'semantic-ui-react';
import RepositoryCard from './RepositoryCard';
import styles from '../styles/SharedLanding.scss';

export interface IProps extends RouteComponentProps<any> {
    token: string;
}

interface IState extends BaseState {
    tokenValid?: boolean;
    repositories: SharedRepository[];
    author: string;
}

export default class SharedLanding extends React.Component<IProps, IState> {
    state: IState = {
        tokenValid: undefined,
        cancelToken: API.aquireNewCancelToken(),
        repositories: [],
        author: ''
    }
    constructor(props: IProps) {
        super(props)
    }

    componentDidMount() {
        console.log(this.props.token);
        
        this.validateToken();
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    async validateToken() {
        try {
            const sharedRepositories = await API.getSharedRepositories(this.props.token, this.state.cancelToken)
            
            this.state.tokenValid = true;
            this.state.repositories = sharedRepositories;
            if(sharedRepositories.length > 0)
            this.state.author = sharedRepositories[0].owner;
            this.setState(this.state);
            
            let tokens = localStorage.getItem("alltokens")
            if (tokens == null){
                tokens = `["${this.props.token}"]`;
            } else {
                let tokensObj = JSON.parse(tokens) as string[];
                if(tokensObj.find(x => x == this.props.token) == undefined) {
                    tokensObj.push(this.props.token);
                    tokens = JSON.stringify(tokensObj);
                }
            }
            localStorage.setItem('alltokens', tokens)
            localStorage.setItem('token', this.props.token)
        } catch {
            this.state.tokenValid = false;
            this.setState(this.state);
        }
    }

    render() {
        return (
            <div id={styles.sharelandingcontainer}>
                <div id={styles.landingHeader}>
                    <div id={styles.availableReposText}>
                        <h3>Repositories shared with you</h3>
                    </div>
                    <div id={styles.authorText}>
                        <p> <b>Author:</b> <i>{this.state.author}</i></p>
                    </div>
                    <div className="clear"></div>
                </div>
                <div id={styles.tokenChecker}>
                    {this.renderTokenValidity()}
                </div>
                <div className={styles.myclass}>
                    <List divided relaxed>
                        {
                            this.state.repositories
                                .map((r : SharedRepository) =>
                                    <RepositoryCard key={r.repo}
                                                    link={`/repo/${r.owner}/${r.repo}/tree/master/`}
                                                    name={r.repo}
                                                    description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                    provider={r.provider}></RepositoryCard>
                                )
                        }
                    </List>
                </div>
            </div>
        )
    }
    renderTokenValidity() {
        if(this.state.tokenValid == undefined) {
            return <p>Checking Token ... </p>
        } else if (this.state.tokenValid) {
            return null;
        } else {
            return <p>Token expired or invalid, please contact your source </p>
        }
    }
}