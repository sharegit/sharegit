import { Button } from '@material-ui/core';
import ContentPanel from 'components/ContentPanel';
import Dropdown from 'components/Dropdown';
import API, { Branch, SharedRepository, SharedToken } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import "react-datepicker/dist/react-datepicker.css";
import { RouteComponentProps } from 'react-router-dom';
import Dictionary from 'util/Dictionary';
import Basic from './Basic';
import Selection from './Selection';
import style from './style.scss';
import config from 'config';
import Loading from 'components/Loading';

interface IProps extends RouteComponentProps {
}

interface IState extends BaseState {
    stamp: string;
    repositories: SharedRepository[];
    selectedRepositories: SharedRepository[];
    customName: string;
    privateNote: string;
    isExpiring: boolean;
    expireDate: Date;
    expireIn: number | 'X';
    defaultBranchSelection?: string;
    errors: Dictionary<string>;
    formState: 0 | 1 | 2;
    creating?: boolean;
    mode: 'd' | 'e' | 'c';
    template?: SharedToken;
    loading?: boolean;
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
        privateNote: '',
        expireIn: 60*24,
        isExpiring: false,
        formState: 0,
        mode: 'c'
    }
    constructor(props: IProps) {
        super(props);
        const state = props.location.state;
        if (state != undefined){
            const existingToken = (state as any).t as SharedToken;
            const mode: 'd' | 'e' = (state as any).m as 'd' | 'e';
            
            this.state.template = existingToken;
            if (existingToken.expireDate != 0)
                this.state.expireIn = existingToken != undefined ? 'X' : this.state.expireIn;
            switch(mode) {
                case 'd':
                    this.state.mode = 'd';
                    break;
                case 'e':
                    this.state.mode = 'e';
                    break;
            }
        }

        window.history.replaceState(null, '')
    }
    async create() {
        try {
            console.log(this.state.stamp);
            const token = this.state.template == undefined || this.state.mode != 'e' ? null : this.state.template.token;
            const newToken = await API.createToken({
                Token: token,
                PrivateNote: this.state.privateNote,
                Stamp: this.state.stamp,
                Repositories: this.state.selectedRepositories,
                CustomName: this.state.customName,
                ExpireDate: this.state.expireDate == undefined || this.state.isExpiring !== true ? 0 : Math.ceil(this.state.expireDate.getTime() / 1000 / 60)
            }, this.state.cancelToken)
            
            navigator.clipboard.writeText(`${config.share_uri}/${newToken.token}`);
            this.props.history.push('/', {newToken: newToken, m: this.state.mode});
        } catch (e) {
            if (!API.wasCancelled(e)) {
                throw e;
            }
        }
    }
    async componentDidMount() {
        this.state.loading = true;
        this.setState(this.state);
        try {
            const myRepos = await API.getMyRepos(this.state.cancelToken)
                myRepos.forEach(r=> {
                    r.branches = r.branches.flatMap(b=>[
                    {name: b.name, snapshot: false, sha: b.sha},
                    {name: b.name, snapshot: true, sha: b.sha}
                ])
            });
            this.state.repositories = [...myRepos];
            switch(this.state.mode) {
                case 'd':
                case 'e':
                    if (this.state.template == undefined)
                        throw new Error('Editing and Duplicating requires a template to be also defined')

                    this.state.customName = this.state.template.customName;
                    this.state.isExpiring = this.state.template.expireDate > 0;
                    this.state.expireDate = new Date(this.state.template.expireDate * 60 * 1000);
                    this.state.template.repositories.forEach(x=>this.addRepositorySelection(x));
                    this.state.template.repositories.forEach(x=>this.changeSelectedBranchesFor(x, x.branches.map(x=>x.name)));
                    break;
            }
            this.state.loading = undefined;
            this.setState(this.state);
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
    
    
    async onSubmit() {
        try {
            if(this.state.errors.length == 0) {
                this.setState({creating: true});
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
            if (newValue.length > 0 && newValue.length <= 50)
                state.errors.remove(id);
            else 
                state.errors.put(id, `Custom Name cannot be empty or cannot exceed 50 characters. Current length: ${newValue.length}`);

            this.state.customName = newValue;

            return state;
        })
    }
    changePrivateNote(id: string, newValue: string) {
        this.setState(state => {
            if (newValue.length <= 250)
                state.errors.remove(id);
            else 
                state.errors.put(id, `Private note cannot exceed 250 characters. Current length: ${newValue.length}`);

            this.state.privateNote = newValue;

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

    changeExpirationDate(date: Date, value: number | 'X') {
        date.setHours(23)
        date.setMinutes(59)
        date.setSeconds(59)
        this.setState({
            expireDate: date,
            expireIn: value
        })
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
    renderFormBasic() {
        if(this.state.formState != 0 || this.state.creating === true || this.state.loading === true)
            return null;
        
        return (<Basic
            customNameError={this.state.errors.get('customName')}
            customNameValue={this.state.customName}
            changeCustomName={this.changeCustomName.bind(this)}

            privateNoteError={this.state.errors.get('privateNote')}
            privateNoteValue={this.state.privateNote}
            changeprivateNote={this.changePrivateNote.bind(this)}

            isExpiring={this.state.isExpiring}
            changeIsExpiring={(newValue) => this.setState({isExpiring: newValue})}
            
            defaultExpire={this.state.expireIn}
            expireDate={this.state.expireDate}
            expireDateChanged={this.changeExpirationDate.bind(this)}

            onNext={() => this.setState({formState: 1})}
        /> )
    }
    renderFormBranches() {
        if(this.state.formState != 1 || this.state.creating === true || this.state.loading === true)
            return null;

        return (<div>
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
        </div>)
    }
    renderFormRepoSelection() {
        if(this.state.formState != 2 || this.state.creating === true || this.state.loading === true)
            return null;
            
        return (<Selection
                onRemoveAllRepos={this.removeAllRepositorySelection.bind(this)}
                onAddAllRepos={this.addAllRepositorySelection.bind(this)}

                onRemoveSingleRepo={this.removeRepositorySelection.bind(this)}
                onAddSingleRepo={this.addRepositorySelection.bind(this)}

                onChangeRepoDownloadable={this.makeRepositoryDownloadable.bind(this)}
                onChangeSelectedBranches={this.changeSelectedBranchesFor.bind(this)}
                onChangePath={this.changePath.bind(this)}

                onBack={() => this.setState({formState: 1})}
                onSubmit={async () => await this.onSubmit()}

                mode={this.state.mode}
                errors={this.state.errors}
                repositories={this.state.repositories}
                selectedRepositories={this.state.selectedRepositories}
                />)
    }
    renderHeader() {
        if ((this.state.mode == 'e' || this.state.mode == 'd') && this.state.template == undefined)
            throw new Error('Editing and duplicating requires a template!');

        switch(this.state.mode) {
            case 'e':
                return `Editing existing link "${this.state.template!.customName}"`;
            case 'd':
                return `Duplicating existing link "${this.state.template!.customName}"`;
            case 'c':
                return 'Creating a new sharable link';
        }
    }
    render() {
        return (
            <div id={style.createToken}>
                <ContentPanel background='light'>
                    <form onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}>
                    <h2>{this.renderHeader()}</h2>
                    
                    {(this.state.creating === true || this.state.loading === true) ? <Loading /> : null}
                    {this.renderFormBasic()}
                    {this.renderFormBranches()}
                    {this.renderFormRepoSelection()}
                    
                    </form>
                </ContentPanel>
            </div>
        )
    }
}