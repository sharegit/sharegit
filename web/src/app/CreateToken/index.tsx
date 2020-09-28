import { Button } from '@material-ui/core';
import ContentPanel from 'components/ContentPanel';
import Dropdown from 'components/Dropdown';
import API, { Branch, SharedRepository } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { RouteComponentProps } from 'react-router-dom';
import Dictionary from 'util/Dictionary';
import Basic from './Basic';
import Selection from './Selection';
import style from './style.scss';

interface IProps extends RouteComponentProps {
}

interface IState extends BaseState {
    stamp: string;
    repositories: SharedRepository[];
    selectedRepositories: SharedRepository[];
    customName: string;
    isExpiring: boolean;
    expireDate: Date;
    defaultBranchSelection?: string;
    errors: Dictionary<string>;
    formState: 0 | 1 | 2;
}

const DEFAULT_EXPIRATION_VALUE: number = 60 * 24;

export default class NewTokenCreation extends React.Component<IProps, IState> {
    state: IState = {
        stamp: Date.now().toString(),
        repositories: [],
        selectedRepositories: [],
        cancelToken: API.aquireNewCancelToken(),
        errors: new Dictionary(),
        expireDate: new Date(new Date().getTime() + DEFAULT_EXPIRATION_VALUE * 60 * 1000),
        defaultBranchSelection: 'master',
        customName: '',
        isExpiring: false,
        formState: 0
    }
    constructor(props: IProps) {
        super(props);
    }
    async create() {
        try {
            console.log(this.state.stamp);
            const newToken = await API.createToken({
                Stamp: this.state.stamp,
                Repositories: this.state.selectedRepositories,
                CustomName: this.state.customName,
                ExpireDate: this.state.expireDate == undefined || this.state.isExpiring !== true ? 0 : Math.ceil(this.state.expireDate.getTime() / 1000 / 60)
            }, this.state.cancelToken)
            this.props.history.push('/shares');
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
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
            this.setState(this.state, () => {
                
                // Assume everything selected
                this.addAllRepositorySelection()
            });
            
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
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
                path: r.path,
                branches: this.getDefaultBranch(r, this.state.defaultBranchSelection)
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
                path: r.path,
                branches: this.getDefaultBranch(r, this.state.defaultBranchSelection)
            });
            this.setState(this.state);
        }
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
    
    
    async onSubmit(e: React.FormEvent<HTMLFormElement>) {
        try {
            e.preventDefault();
            if(this.state.errors.length == 0) {
                await this.create();
            } else {
                // TODO: display error message to fix all errors
            }
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    changeCustomName(id: string, newValue: string) {
        this.setState(state => {
            if (newValue.length > 0 && newValue.length < 50)
                state.errors.remove(id);
            else 
                state.errors.put(id, `Custom Name cannot be empty or cannot exceed 50 characters. Current length: ${newValue.length}`);

            this.state.customName = newValue;

            return state;
        })
    }
    changePath(r: SharedRepository, id: string, newValue: string) {
        this.setState(state => {

            if(newValue.length > 1024)
                state.errors.put(id, `Path cannot exceed 1024 characters. Current length: ${newValue.length}`);
            else
                state.errors.remove(id);

            const index = state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
            if(index > -1)
                state.selectedRepositories[index].path = newValue;
            
            return state;
        })
    }

    changeExpirationDate(date: Date) {
        date.setHours(23)
        date.setMinutes(59)
        date.setSeconds(59)
        this.setState({expireDate: date})
    }


    updateDefaultBranch(data: string) {
        const defaultBranch = data == 'X' ? undefined : data;
        this.setState({
            defaultBranchSelection: defaultBranch,
            selectedRepositories: this.state.selectedRepositories.map(r=> (
                {
                    id: r.id,
                    owner: r.owner,
                    repo: r.repo,
                    provider: r.provider,
                    description: r.description,
                    snapshot: r.snapshot,
                    downloadAllowed: r.downloadAllowed,
                    path: r.path,
                    branches: this.getDefaultBranch(r, defaultBranch)
                }
            ))
        })    
    }
    getDefaultBranch(repo: SharedRepository, defaultBranchSelection?: string): Array<Branch> {
        if (defaultBranchSelection == undefined)
            return [];
        
        const s = defaultBranchSelection.split(' ')
        const branch = {
            name: s[0],
            sha: false,
            snapshot: (s.length>1 && s[1] == '(Snapshot)')
        }
        const originalRepo = this.state.repositories.find(x=>x.owner==repo.owner && x.provider==repo.provider && x.repo == repo.repo);
        if (originalRepo != undefined && originalRepo.branches.some(x=>x.name == branch.name))
            return [branch];
        else
            return [];
    }
    render() {
        return (
            <ContentPanel background='light'>
                <div id={style.createToken}>
                    <form onSubmit={async (e) => {
                            await this.onSubmit(e)
                        }}>
                    <h2>Create a new share token</h2>
                    {this.state.formState != 0 ? null
                    :   <Basic
                            customNameError={this.state.errors.get('customName')}
                            customNameValue={this.state.customName}
                            changeCustomName={this.changeCustomName.bind(this)}

                            isExpiring={this.state.isExpiring}
                            changeIsExpiring={(newValue) => this.setState({isExpiring: newValue})}
                            
                            expireDate={this.state.expireDate}
                            expireDateChanged={this.changeExpirationDate.bind(this)}

                            onNext={() => this.setState({formState: 1})}
                        />}
                    {this.state.formState != 1 ? null
                    :   <div>
                            <p>Please select the default branch of your repositories.</p>
                            <Dropdown
                                label='Default branch'
                                helperText='If the selected branch name exists we will attempt to set it for each new repository you select as a default. You can change this on a repo-by-repo basis in the next step. (Snapshot) means the current HEAD commit of the branch will be shared.'
                                onChange={(data) => this.updateDefaultBranch(data as string) }
                                defaultValue='master'
                                options={[
                                    { key: 'master', value: 'master', display: 'master (set all)' },
                                    { key: 'master (Snapshot)', value: 'master (Snapshot)', display: 'master (Snapshot) (set all)' },
                                    { key: 'staging', value: 'staging', display: 'staging (set all)' },
                                    { key: 'staging (Snapshot)', value: 'staging (Snapshot)', display: 'staging (Snapshot) (set all)' },
                                    { key: 'default', value: 'default', display: 'default (set all)' },
                                    { key: 'default (Snapshot)', value: 'default (Snapshot)', display: 'default (Snapshot) (set all)' },
                                    { key: 'main', value: 'main', display: 'main (set all)' },
                                    { key: 'main (Snapshot)', value: 'main (Snapshot)', display: 'main (Snapshot) (set all)' },
                                    { key: 'X', value: 'X', display: 'Not set (clear all)' }
                                ]}
                            />
                            <Button onClick={() => this.setState({formState: 0})}>Back</Button>
                            <Button onClick={() => this.setState({formState: 2})}>Next</Button>
                        </div>}
                    
                    {this.state.formState != 2 ? null
                    :   <Selection
                            onRemoveAllRepos={this.removeAllRepositorySelection.bind(this)}
                            onAddAllRepos={this.addAllRepositorySelection.bind(this)}

                            onRemoveSingleRepo={this.removeRepositorySelection.bind(this)}
                            onAddSingleRepo={this.addRepositorySelection.bind(this)}

                            onChangeRepoDownloadable={this.makeRepositoryDownloadable.bind(this)}
                            onChangeSelectedBranches={this.changeSelectedBranchesFor.bind(this)}
                            onChangePath={this.changePath.bind(this)}

                            errors={this.state.errors}
                            repositories={this.state.repositories}
                            selectedRepositories={this.state.selectedRepositories}
                            />}
                    </form>
                </div>
            </ContentPanel>
        )
    }
}