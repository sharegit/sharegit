import React from 'react'
import { Dropdown, DropdownItemProps } from 'semantic-ui-react'
import axios, {AxiosResponse, CancelTokenSource} from 'axios'
import config from '../config';

interface IState {
    branches: String[];
    cancelToken: CancelTokenSource;
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
        cancelToken: axios.CancelToken.source(),
        current:''
    }

    constructor(props: IProps) {
        super(props);
    }
    componentDidMount() {
        const request = `${config.apiUrl}/repo/${this.props.user}/${this.props.repo}/branches`;
        axios.get<String[]>(request,  { cancelToken: this.state.cancelToken.token } )
            .then((res: AxiosResponse<String[]>) => {
                this.state.branches = res.data;
                this.state.current = this.props.current;
                this.setState(this.state);
            })
            .catch(() => {
                console.log('Error!');
            });
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
                      value={this.props.current}
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