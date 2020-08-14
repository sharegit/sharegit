import React from 'react'
import { RouteComponentProps } from 'react-router';
import API, { SharedRepository } from '../models/API';
import { BaseState } from '../models/BaseComponent';
import { List } from 'semantic-ui-react';
import RepositoryCard from './RepositoryCard';

export interface IProps extends RouteComponentProps<any> {
    token: string;
}

interface IState extends BaseState {
    tokenValid?: boolean;
    repositories: SharedRepository[];
}

export default class SharedLanding extends React.Component<IProps, IState> {
    state: IState = {
        tokenValid: undefined,
        cancelToken: API.aquireNewCancelToken(),
        repositories: []
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

    validateToken() {
        API.getSharedRepositories(this.props.token, this.state.cancelToken)
        .then((res) => {
            this.state.tokenValid = true;
            this.state.repositories = res;
            this.setState(this.state);
            
            localStorage.setItem('token', this.props.token)
        })
        .catch(()=>{
            this.state.tokenValid = false;
            this.setState(this.state);
        });
    }

    render() {
        return (
            <div>
                {this.renderTokenValidity()}
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