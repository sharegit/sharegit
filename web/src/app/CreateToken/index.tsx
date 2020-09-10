import RepositoryCard from 'app/SharedLanding/RepositoryCard';
import ContentPanel from 'components/ContentPanel';
import FormTextField from 'components/FormTextField';
import API, { SharedRepository } from 'models/API';
import { BaseState } from 'models/BaseState';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Button, Checkbox, CheckboxProps, Dropdown, Form, FormProps, List, FormCheckbox } from 'semantic-ui-react';
import Dictionary from 'util/Dictionary';
import style from './style.scss';
import printDate from 'util/Date';

interface IProps extends RouteComponentProps {
}

interface IState extends BaseState {
    stamp: string;
    repositories: SharedRepository[];
    selectedRepositories: SharedRepository[];
    customName?: string;
    isExpiring?: boolean;
    expireDate?: Date;
    errors: Dictionary<string>
}

const DEFAULT_EXPIRATION_VALUE: number = 60 * 24;

export default class NewTokenCreation extends React.Component<IProps, IState> {
    state: IState = {
        stamp: Date.now().toString(),
        repositories: [],
        selectedRepositories: [],
        cancelToken: API.aquireNewCancelToken(),
        errors: new Dictionary(),
        expireDate: new Date(new Date().getTime() + DEFAULT_EXPIRATION_VALUE * 60 * 1000)
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
                path: r.path,
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
                path: r.path,
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
    async onSubmit(e: React.FormEvent<HTMLFormElement>, d: FormProps) {
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
                state.errors.put(id, `Path cannot exceed 50 characters. Current length: ${newValue.length}`);
            else
                state.errors.remove(id);

            const index = state.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
            if(index > -1)
                state.selectedRepositories[index].path = newValue;

            return state;
        })
    }
    setExpiring(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) {
        if(data.checked != undefined) {
            this.setState({isExpiring: data.checked});
        }
    }

    // expires_in in minutes
    changeExpiration(expiresIn: number) {
        const current = new Date();
        const expirationDate = new Date(current.getTime() + expiresIn * 60 * 1000);
        this.setState({expireDate: expirationDate})
    }
    render() {
        return (
            <ContentPanel background='light'>
                <div id={style.createToken}>
                    <Form onSubmit={async (e, d) => {
                            await this.onSubmit(e, d)
                        }}>
                    <h2>Create a new share token</h2>
                    <FormTextField  
                            id='customName'
                            type='field'
                            label='Custom Name'
                            error={this.state.errors.get('customName')}
                            value={this.state.customName}
                            onChanged={this.changeCustomName.bind(this)}
                            placeholder='My token for company X'
                            description='This name will be displayed to you as well as to the reciever as an easy name to remember when referring to this shared link in place of the random token.'
                         />

                    <Checkbox label='Expiring token' onChange={this.setExpiring.bind(this)} />
                    {!!this.state.isExpiring && 
                        <div>
                            <Dropdown
                                onChange={(event, data) => {
                                    this.changeExpiration(data.value as number)
                                }}
                                defaultValue={DEFAULT_EXPIRATION_VALUE}
                                options={[
                                    { key: '10-min', value: 10, text: '10 minutes' },
                                    { key: '1-day', value: 60 * 24, text: '1 day' },
                                    { key: '1-week', value: 60 * 24 * 7, text: '1 week' },
                                    { key: '1-month', value: 60 * 24 * 30, text: '1 month' },
                                    // TODO: open date picker here: { key: '4', value: 'X', text: 'custom' }
                            ]} />
                            <p>Token will expire on: {this.state.expireDate != undefined ? printDate(this.state.expireDate) : ''}</p>
                            <p>Please note that due to caching, if someone visits your link just at the right time, they will be able to access it for up to one hour.</p>
                        </div>}
                    <h3>Available repositories</h3>
                    <Button onClick={(e) => {
                        e.preventDefault();
                        this.removeAllRepositorySelection();
                    }}>Remove All</Button>
                    <Button onClick={(e) => {
                        e.preventDefault();
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
                                                                <Button onClick={(e) => {
                                                                    e.preventDefault();
                                                                    this.removeRepositorySelection(r);
                                                                }}>Remove</Button>

                                                                {r.provider == 'github' ? 
                                                                <Checkbox checked={this.isRepositoryDownloadable(r)} onChange={(event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
                                                                    this.makeRepositoryDownloadable(r, data.checked == undefined ? false : data.checked);
                                                                }} label='Downloadable'></Checkbox>
                                                            :   null}
                                                                <FormTextField  
                                                                    id={`path_${r.id}_${r.owner}_${r.repo}_${r.provider}`}
                                                                    type='field'
                                                                    label='Path'
                                                                    error={this.state.errors.get(`path_${r.id}_${r.owner}_${r.repo}_${r.provider}`)}
                                                                    value={r.path}
                                                                    onChanged={(id, newValue) => this.changePath(r, id, newValue)}
                                                                    placeholder='backend/api/'
                                                                    description={`The CASE SENSITIVE, absolute path inside your repository which will be accessible by this link.
                                                                    If you wish to share a directory use a forward slash terminated path, otherwise use the absolute path of the file.
                                                                    Leave empty if you wish to share the whole repository.
                                                                    Example: 'backend/' will give access to the backend folder with it's content.
                                                                    You can also share only one file, example: 'backend/README.md'.`}
                                                                />
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
                                                            :   <Button onClick={(e) => {
                                                                    e.preventDefault();
                                                                    this.addRepositorySelection(r);
                                                                }}>Add</Button>
                                                            }
                                                        </RepositoryCard>
                                    )
                        }
                    </List>
                    <Button color='yellow' onClick={() => this.props.history.goBack()}>Cancel</Button>
                    {this.canCreate() ? 
                        <Button type='submit'>Create!</Button>
                    :   <Button disabled >Create!</Button>
                    }
                    </Form>
                </div>
            </ContentPanel>
        )
    }
}