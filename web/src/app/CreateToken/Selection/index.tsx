import { Button, GridList, List, Grid } from '@material-ui/core';
import { SharedRepository } from 'models/API';
import React from 'react';
import Dictionary from 'util/Dictionary';
import SelectableRepositoryCard from '../SelectableRepositoryCard.tsx';
import style from './style.scss';

interface IProps {
    onRemoveAllRepos: () => void;
    onAddAllRepos: () => void;

    onRemoveSingleRepo: (r: SharedRepository) => void;
    onAddSingleRepo: (r: SharedRepository) => void;

    onChangeRepoDownloadable: (r: SharedRepository, downloadable: boolean) => void;
    onChangeSelectedBranches: (r: SharedRepository, newBranches: string[]) => void;
    onChangePath: (r: SharedRepository, id: string, newPath: string) => void;

    onBack: () => void;
    onSubmit: () => void;

    mode: 'e' | 'd' | 'c';
    errors: Dictionary<string>;
    repositories: SharedRepository[];
    selectedRepositories: SharedRepository[];
}

export default class Selection extends React.Component<IProps> {
    getRepoLink(r: SharedRepository): string {
        switch(r.provider) {
            case 'github':
                return `https://github.com/${r.owner}/${r.repo}`;
            case 'gitlab':
                return `https://gitlab.com/projects/${r.id}`;
            case 'bitbucket':
                return `https://bitbucket.org/${r.owner}/${r.repo}`;
        }
    }
    isSelected(r: SharedRepository): boolean {
        return this.props.selectedRepositories.find((s) => {
            return s.owner == r.owner && s.repo == r.repo && s.provider == r.provider;
        }) != undefined;
    }
    isRepositoryDownloadable(r: SharedRepository) {
        const index = this.props.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            return this.props.selectedRepositories[index].downloadAllowed;
        } else {
            return false;
        }
    }
    getSelectedBranchesFor(r: SharedRepository): Array<string> {
        const index = this.props.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1)
            return this.props.selectedRepositories[index].branches.map(x=>x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name);
        else 
            return [];
    }
    getRepositoryAccessPath(r: SharedRepository) {
        const index = this.props.selectedRepositories.findIndex(x=>x.owner==r.owner && x.provider==r.provider && x.repo == r.repo);
        if (index > -1) {
            const path = this.props.selectedRepositories[index].path;
            if(path == undefined || path == null)
                return '';
            else
                return path;
        } else {
            return '';
        }
    }
    getCreateLabel() {
        switch(this.props.mode) {
            case 'e':
                return 'Edit';
            case 'd':
                return 'Duplicate';
            case 'c':
                return 'Create';
        }
    }
    canCreate(): boolean {
        if (this.props.selectedRepositories.length == 0)
            return false;
        if(this.props.selectedRepositories.findIndex(x=>x.branches.length == 0) > -1)
            return false;
        if(this.props.selectedRepositories.some(x => x.provider != 'github' && x.downloadAllowed))
            return false;
        if(this.props.errors.length > 0)
            return false;

        return true;
    }
    render() {
        return [
            <Button key='remAll' onClick={(e) => {
                e.preventDefault();
                this.props.onRemoveAllRepos();
            }}>Remove All</Button>,
            <Button key='addAll' onClick={(e) => {
                e.preventDefault();
                this.props.onAddAllRepos();
            }}>Add All</Button>,
            <List key='selectedRepoList'>
                {this.props.repositories
                            .filter(x=>this.isSelected(x))
                            .map((r : SharedRepository) =>
                                <SelectableRepositoryCard key={r.repo}
                                                baseRespo={r}
                                                link={this.getRepoLink(r)}
                                                onChangeRepoDownloadable={(r, downloadable) => this.props.onChangeRepoDownloadable(r, downloadable)}
                                                onChangeSelectedBranches={(r, newBranches) => this.props.onChangeSelectedBranches(r, newBranches)}
                                                onChangePath={(r, id, newPath) => this.props.onChangePath(r, id, newPath)}
                                                accessPath={this.getRepositoryAccessPath(r)}
                                                pathError={this.props.errors.get(`path_${r.id}_${r.owner}_${r.repo}_${r.provider}`)}
                                                
                                                selectedBranches={this.getSelectedBranchesFor(r)}
                                                selected={true}
                                                downloadable={this.isRepositoryDownloadable(r)}
                                                onClick={() => {
                                                    this.props.onRemoveSingleRepo(r);
                }} /> ) }
            </List>,
            <Grid container direction='row' className={style.selectionList} key='selectableRepoList'>
                {this.props.repositories
                            .filter(x=>!this.isSelected(x))
                            .map((r : SharedRepository) =>
                                <SelectableRepositoryCard key={r.repo}
                                                baseRespo={r}
                                                link={this.getRepoLink(r)}
                                                onChangeRepoDownloadable={(r, downloadable) => this.props.onChangeRepoDownloadable(r, downloadable)}
                                                onChangeSelectedBranches={(r, newBranches) => this.props.onChangeSelectedBranches(r, newBranches)}
                                                onChangePath={(r, id, newPath) => this.props.onChangePath(r, id, newPath)}
                                                accessPath={this.getRepositoryAccessPath(r)}
                                                pathError={this.props.errors.get(`path_${r.id}_${r.owner}_${r.repo}_${r.provider}`)}
                                                
                                                selectedBranches={this.getSelectedBranchesFor(r)}
                                                selected={false}
                                                downloadable={this.isRepositoryDownloadable(r)}
                                                onClick={() => {
                                                    this.props.onAddSingleRepo(r);
                }} /> ) }
            </Grid>,
            <Button key='back' onClick={() => this.props.onBack()}>Back</Button>,
            <Button key='create' disabled={!this.canCreate()} onClick={() => this.props.onSubmit()}>{this.getCreateLabel()}</Button>
        ]
    }
}