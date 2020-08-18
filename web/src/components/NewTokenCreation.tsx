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
    async create() {
        const newToken = await API.createToken({
            Stamp: this.state.stamp,
            Repositories: this.state.selectedRepositories
        }, this.state.cancelToken)
        
        this.props.tokenCreatedCallback(newToken);
        this.state.stamp = Date.now().toString();
        this.setState(this.state);
        this.close()
    }
    async componentDidMount() {
        const myRepos = await API.getMyRepos(this.state.cancelToken)
        
        this.state.repositories = [...myRepos];
        // Assume everything selected
        this.state.selectedRepositories = [...myRepos];
        this.setState(this.state);

    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }
    isSelected(r: SharedRepository): boolean {
        return this.state.selectedRepositories.find((s) => {
            return s.owner == r.owner && s.repo == r.repo && s.provider == r.provider;
        }) != undefined;
    }
    removeAllRepositorySelection(): void {
        this.state.selectedRepositories = [];
        this.setState(this.state);
    }
    removeRepositorySelection(r: SharedRepository): void {
        const index = this.state.selectedRepositories.indexOf(r, 0);
        if (index > -1) {
            this.state.selectedRepositories.splice(index, 1);
            this.setState(this.state);
        }
    }
    addAllRepositorySelection(): void {
        this.state.selectedRepositories = [...this.state.repositories];
        this.setState(this.state);
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
                    <Button onClick={() => {
                        this.removeAllRepositorySelection();
                    }}>Remove All</Button>
                    <Button onClick={() => {
                        this.addAllRepositorySelection();
                    }}>Add All</Button>
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
                    {this.state.selectedRepositories.length > 0 ? 
                        <Button onClick={async (e, d) => {
                            await this.create()
                        }}>Create!</Button>
                    :   <Button disabled >Create!</Button>
                    }
                </Modal.Actions>
            </Modal>
        )
    }
}