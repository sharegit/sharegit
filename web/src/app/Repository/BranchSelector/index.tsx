import API, { Branch, CancelToken } from 'models/API';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Dropdown from 'components/Dropdown';
import style from './style.scss';

interface IState {
    branches: Branch[];
    cancelToken: CancelToken;
    current: string;
}

interface IProps extends RouteComponentProps<any> {
    user: string;
    repo: string;
    current: string;
    onBranchSelectionChanged: (newBranch: string) => void;
}

export default class BranchSelector extends React.Component<IProps, IState> {

    state : IState = {
        branches: [],
        cancelToken: API.aquireNewCancelToken(),
        current:''
    }

    constructor(props: IProps) {
        super(props);
    }
    async componentDidMount() {
        this.state.current = this.props.current;
        // Assume the branch we're trying to display is a valid branch to avoid popping
        this.state.branches = [ {name: this.props.current, snapshot: false, sha: false} ];
        this.setState(this.state);
        const query = new URLSearchParams(this.props.location.search);
        const token = query.get('token') as string;
        try {
            const branches = await API.getSharedBranches(token, this.props.user, this.props.repo, this.state.cancelToken)
            this.state.branches = branches;
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

    changeBranch(newBranch: string) {
        this.props.onBranchSelectionChanged(newBranch);
    }

    render() {
        return (
            <Dropdown className={style.branchSelector}  
                      placeholder='Select Branch'
                      search
                      label=''
                      helperText=''
                      selection
                      key={this.state.current}
                      value={this.state.current}
                      onChange={
                        (value) => {
                            if(value != undefined) {
                                const newValue: string = value as string;
                                this.changeBranch(newValue);
                            }
                        }
                      }
                      options={
                          this.state.branches.map((branch) => (
                                {key: branch.name, display: branch.name, value: branch.name}
                              ))
                      }
            />
        )
    }
}