import React from 'react';
import { Modal, Button, List, Icon, Dropdown, Checkbox, CheckboxProps } from 'semantic-ui-react';
import API, { SharedRepository, SharedToken, Branch } from 'models/API';
import { BaseState } from 'models/BaseState';
import RepositoryCard from 'app/SharedLanding/RepositoryCard';
import ContentPanel from 'components/ContentPanel';
import style from './style.scss';

interface IProps {
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
        try {
            const newToken = await API.createToken({
                Stamp: this.state.stamp,
                Repositories: this.state.selectedRepositories
            }, this.state.cancelToken)
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
            
        this.state.stamp = Date.now().toString();
        this.setState(this.state);
        this.close()
    }
    async componentDidMount() {
        try {
            const myRepos = await API.getMyRepos(this.state.cancelToken)
                myRepos.forEach(r=> {
                    r.branches = r.branches.flatMap(b=>[
                    {name: b.name, snapshot: false, sha: b.sha},
                    {name: b.name, snapshot: true, sha: b.sha}
                ])
            });
            this.state.repositories = [...myRepos];
            this.setState(this.state);
            
            // Assume everything selected
            this.addAllRepositorySelection()
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
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
        const index = this.state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            this.state.selectedRepositories.splice(index, 1);
            this.setState(this.state);
        }
    }
    addAllRepositorySelection(): void {
        this.state.selectedRepositories = this.state.repositories.map(r=> (
            {
                id: r.id,
                owner: r.owner,
                repo: r.repo,
                provider: r.provider,
                description: r.description,
                snapshot: r.snapshot,
                downloadAllowed: r.downloadAllowed,
                branches: []
            }
        ));
        this.setState(this.state);
    }
    addRepositorySelection(r: SharedRepository): void {
        const index = this.state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index == -1) {
            console.log('Adding repo')
            this.state.selectedRepositories.push({
                id: r.id,
                owner: r.owner,
                repo: r.repo,
                provider: r.provider,
                description: r.description,
                snapshot: r.snapshot,
                downloadAllowed: r.downloadAllowed,
                branches: []
            });
            this.setState(this.state);
        }
    }
    canCreate(): boolean {
        if (this.state.selectedRepositories.length == 0)
            return false;
        if(this.state.selectedRepositories.findIndex(x=>x.branches.length == 0) > -1)
            return false;
        if(this.state.selectedRepositories.some(x => x.provider != 'github' && x.downloadAllowed))
            return false;

        return true;
    }
    changeSelectedBranchesFor(r: SharedRepository, values: string[]) {
        const index = this.state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            this.state.selectedRepositories[index].branches = values.map(x=>{
                const s = x.split(' ')
                console.log(r);
                const branch = r.branches.find(x=>x.name == s[0] && x.snapshot == (s.length>1 && s[1] == '(Snapshot)'))
                console.log(branch);
                if(branch != undefined)
                    return ({
                        name: branch.name,
                        snapshot: branch.snapshot,
                        sha: branch.sha
                    })
                else
                    return ({
                        name: s[0],
                        snapshot: true,
                        sha: true
                    })
                });
            this.setState(this.state);
        }
    }
    makeRepositoryDownloadable(r: SharedRepository, downloadable: boolean) {
        if(r.provider != 'github')
            throw new Error('Only github repositories can be set to Downloadable');

        const index = this.state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            this.state.selectedRepositories[index].downloadAllowed = downloadable;
            console.debug(downloadable);
            this.setState(this.state);
        }
    }
    isRepositoryDownloadable(r: SharedRepository) {
        const index = this.state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            return this.state.selectedRepositories[index].downloadAllowed;
        } else {
            return false;
        }
    }
    render() {
        return (
            <ContentPanel background='light'>
                <div id={style.createToken}>
                    <h2>Create a new share token</h2>
                    <h3>Available repositories</h3>
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
                                                        link={``}
                                                        deselected={this.isSelected(r) ? undefined : true}
                                                        name={r.repo}
                                                        description={!!r.description ? r.description : "No description, website, or topics provided."}
                                                        downloadable={this.isRepositoryDownloadable(r)}
                                                        provider={r.provider}>
                                                            {this.isSelected(r) ?
                                                                <div>
                                                                <Button onClick={() => {
                                                                    this.removeRepositorySelection(r);
                                                                }}>Remove</Button>

                                                                {r.provider == 'github' ? 
                                                                <Checkbox checked={this.isRepositoryDownloadable(r)} onChange={(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
                                                                    this.makeRepositoryDownloadable(r, data.checked == undefined ? false : data.checked);
                                                                }} label='Downloadable'></Checkbox>
                                                            :   null}

                                                                <Dropdown
                                                                    placeholder='Select a branch or type the commit SHA'
                                                                    fluid
                                                                    search
                                                                    selection
                                                                    multiple
                                                                    allowAdditions
                                                                    onAddItem={(event, data) => {
                                                                        r.branches.push({name: data.value as string, snapshot: true, sha: true})
                                                                        this.setState(this.state)
                                                                    }}
                                                                    onChange={(event, data) => {
                                                                        this.changeSelectedBranchesFor(r, data.value as string[])
                                                                    }}
                                                                    options={r.branches.map(x=> (
                                                                        {
                                                                            key: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name,
                                                                            value: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name,
                                                                            text: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name
                                                                        }
                                                                    ))}
                                                                />
                                                                </div>
                                                            :   <Button onClick={() => {
                                                                    this.addRepositorySelection(r);
                                                                }}>Add</Button>
                                                            }
                                                        </RepositoryCard>
                                    )
                        }
                    </List>
                    <Button color='yellow' onClick={this.close.bind(this)}>Cancel</Button>
                    {this.canCreate() ? 
                        <Button onClick={async (e, d) => {
                            await this.create()
                        }}>Create!</Button>
                    :   <Button disabled >Create!</Button>
                    }
                </div>
            </ContentPanel>
        )
    }
}