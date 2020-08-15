import React from 'react'
import { Dropdown, DropdownItemProps } from 'semantic-ui-react'
import API, { CancelToken } from '../models/API';

interface IState {
    branches: String[];
    cancelToken: CancelToken;
    current: string;
}

interface IProps {
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
    componentDidMount() {
        this.state.current = this.props.current;
        // Assume the branch we're trying to display is a valid branch to avoid popping
        this.state.branches = [this.props.current];
        this.setState(this.state);
        API.getBranches(this.props.user, this.props.repo, this.state.cancelToken)
        .then((res) => {
            this.state.branches = res;
            this.setState(this.state);
        })
    }
    componentWillUnmount() {
        this.state.cancelToken.cancel();
    }

    changeBranch(newBranch: string) {
        this.props.onBranchSelectionChanged(newBranch);
    }

    render() {
        return (
            <Dropdown placeholder='Select Branch'
                      fluid
                      search
                      selection
                      key={this.state.current}
                      value={this.state.current}
                      onChange={
                        (event, props) => {
                            if(props.value != undefined) {
                                const newValue: string = props.value as string;
                                this.changeBranch(newValue);
                            }
                        }
                      }
                      options={
                          this.state.branches.map((item, _) => ({text: item, value: item} as DropdownItemProps))
                      }
            />
        )
    }
}