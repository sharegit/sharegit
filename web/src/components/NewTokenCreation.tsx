import React from 'react';
import { Modal, Button, List, Icon } from 'semantic-ui-react';
import API, { SharedRepository } from '../models/API';
import { BaseState } from '../models/BaseComponent';
import RepositoryCard from './RepositoryCard';

interface IProps {
    tokenCreatedCallback: (token: string) => void;
}

interface IState extends BaseState {
    isOpen: boolean;
    stamp: string;
    repositories: SharedRepository[];
    selectedRepositories: SharedRepository[];
}

export default class NewTokenCreation extends React.Component<IProps> {
    state: IState = {
        isOpen: false,
        stamp: Date.now().toString(),
        repositories: [],
        selectedRepositories: [],
        cancelToken: API.aquireNewCancelToken()
    }
    open() {
        this.state.isOpen = true;
        this.setState(this.state);
    }
    close() {
        this.state.isOpen = false;
        this.setState(this.state);
    }
    create() {
        API.createToken({
            Stamp: this.state.stamp,
            Repositories: this.state.selectedRepositories
        }, this.state.cancelToken)
        .then((res) => {
            this.props.tokenCreatedCallback(res.data);
        });
        this.close()
    }
    componentDidMount() {
        API.getMyRepos(this.state.cancelToken)
        .then((res) => {
            this.state.repositories = [...res];
            // Assume everything selected
            this.state.selectedRepositories = [...res];
            this.setState(this.state);
        });
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    isSelected(r: SharedRepository): boolean {
        return this.state.selectedRepositories.find((s) => {
            return s.owner == r.owner && s.repo == r.repo && s.provider == r.provider;
        }) != undefined;
    }
    removeRepositorySelection(r: SharedRepository): void {
        const index = this.state.selectedRepositories.indexOf(r, 0);
        if (index > -1) {
            this.state.selectedRepositories.splice(index, 1);
            this.setState(this.state);
        }
    }
    addRepositorySelection(r: SharedRepository): void {
        const index = this.state.selectedRepositories.indexOf(r, 0);
        if (index == -1) {
            this.state.selectedRepositories.push(r);
            this.setState(this.state);
        }
    }
    render() {
        return (
            <Modal
                onClose={this.close.bind(this)}
                onOpen={this.open.bind(this)}
                open={this.state.isOpen}
                trigger={<Button primary>Create new token</Button>}>
                <Modal.Header>Create a new share token</Modal.Header>
                <Modal.Content>
                    <Modal.Header>Available repositories</Modal.Header>
                    <Modal.Description>
                    
                    <List divided relaxed>
                        {
                            this.state.repositories
                                    .map((r : SharedRepository) =>
                                        <RepositoryCard key={r.repo}
                                                        link={`/repo/${r.owner}/${r.repo}/tree/master/`}
                                                        deselected={this.isSelected(r) ? undefined : true}
                                                        name={r.repo}
                                                        description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                        provider='github'>
                                                            {this.isSelected(r) ?
                                                                <Button onClick={() => {
                                                                    this.removeRepositorySelection(r);
                                                                }}>Remove</Button>
                                                            :   <Button onClick={() => {
                                                                    this.addRepositorySelection(r);
                                                                }}>Add</Button>
                                                            }
                                                        </RepositoryCard>
                                    )
                        }
                    </List>
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color='yellow' onClick={this.close.bind(this)}>Cancel</Button>
                    <Button onClick={this.create.bind(this)}>Create!</Button>
                </Modal.Actions>
            </Modal>
        )
    }
}