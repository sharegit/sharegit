import { Button, Card, Checkbox, FormControlLabel, GridListTile, ListItemIcon, ListItemText } from '@material-ui/core';
import { GetApp } from '@material-ui/icons';
import BitbucketMark from 'assets/icons/bitbucket-mark.svg';
import GithubMark from 'assets/icons/github-mark-dark.png';
import GitlabMark from 'assets/icons/gitlab-mark.png';
import CustomIcon from 'components/CustomIcon';
import Dropdown from 'components/Dropdown';
import FormTextField from 'components/FormTextField';
import { SharedRepository } from 'models/API';
import React from 'react';
import styles from './style.scss';

interface IState { }

interface IProps {
    link: string;
    baseRespo: SharedRepository;
    downloadable: boolean;
    selected: boolean;

    selectedBranches: Array<string>;
    pathError: string | undefined;
    accessPath: string;

    onClick: () => void;
    onChangeRepoDownloadable: (r: SharedRepository, downloadable: boolean) => void;
    onChangeSelectedBranches: (r: SharedRepository, newBranches: string[]) => void;
    onChangePath: (r: SharedRepository, id: string, newPath: string) => void;
}

export default class SelectableRepositoryCard extends React.Component<IProps, IState> {

    getProviderIcon() {
        switch (this.props.baseRespo.provider) {
            case 'github':
                return <CustomIcon src={GithubMark} />
            case 'gitlab':
                return <CustomIcon src={GitlabMark} />
            case 'bitbucket':
                return <CustomIcon src={BitbucketMark} />
        }
    }

    render() {
        return (
            <GridListTile 
                className={`${styles.repositoryCard} ${this.props.selected ? '' : styles.deselected}`}
                component={Card}
                onClick={() => { if (!this.props.selected) this.props.onClick();}}
            >
                <ListItemIcon>
                    {this.getProviderIcon()}
                </ListItemIcon>
                <ListItemText
                    onClick={(e) => {if(this.props.selected) e.stopPropagation();}}
                    primary={
                        <React.Fragment>
                            <a href={this.props.link} target="_blank">
                                {this.props.baseRespo.repo}
                            </a>
                            {this.props.downloadable ? <GetApp /> : null}
                        </React.Fragment>
                    }
                    secondary={!!this.props.baseRespo.description ? this.props.baseRespo.description : "No description, website, or topics provided."}
                />
                
                {!this.props.selected ? null
                :   <div>
                    <Button onClick={() => this.props.onClick()}>Deselect</Button>
                    {this.props.baseRespo.provider != 'github' ? null
                    :   <FormControlLabel
                            onClick={(e) => e.stopPropagation()}
                            control={
                                <Checkbox
                                    onClick={(e) => e.stopPropagation()}
                                    checked={this.props.downloadable}
                                    onChange={(event) => {
                                        this.props.onChangeRepoDownloadable(this.props.baseRespo, event.target.checked == undefined ? false : event.target.checked);
                                    }}
                                    name={`isDownloadable${this.props.baseRespo.repo}${this.props.baseRespo.id}${this.props.baseRespo.owner}${this.props.baseRespo.provider}`}
                                />}
                            label="Downloadable" />}
                    
                    <FormTextField  
                        id={`path_${this.props.baseRespo.repo}${this.props.baseRespo.id}${this.props.baseRespo.owner}${this.props.baseRespo.provider}`}
                        type='field'
                        label='Path'
                        error={this.props.pathError}
                        value={this.props.accessPath}
                        onChanged={(id, newValue) => this.props.onChangePath(this.props.baseRespo, id, newValue)}
                        placeholder='backend/api/'
                        description={`The CASE SENSITIVE, absolute path inside your repository which will be accessible by this link.
                        If you wish to share a directory use a forward slash terminated path, otherwise use the absolute path of the file.
                        Leave empty if you wish to share the whole repository.
                        Example: 'backend/' will give access to the backend folder with it's content.
                        You can also share only one file, example: 'backend/README.md'.`}
                    />
                    <Dropdown
                        placeholder='Select a branch or type the commit SHA'
                        search
                        selection
                        multiple
                        allowAdditions
                        onAddItem={(data) => {
                            this.props.baseRespo.branches.push({name: data as string, snapshot: true, sha: true})
                        }}
                        onChange={(data) => {
                            this.props.onChangeSelectedBranches(this.props.baseRespo, data as string[])
                        }}
                        value={this.props.selectedBranches}
                        options={this.props.baseRespo.branches.map(x=> (
                            {
                                key: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name,
                                value: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name,
                                display: x.snapshot && !x.sha ? `${x.name} (Snapshot)` : x.name
                            }
                        ))}
                    />
                    </div>
                }
            </GridListTile  >
        )
    }
}