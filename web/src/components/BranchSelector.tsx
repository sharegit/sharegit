import React from 'react'
import { Dropdown, DropdownItemProps } from 'semantic-ui-react'

interface IState {}

interface IProps {
    branches: String[];
}

export default class BranchSelector extends React.Component<IProps, IState> {



    render() {
        return (
            <Dropdown placeholder='Select Branch'
                      fluid
                      search
                      selection
                      options={
                          this.props.branches.map((item, _) => ({text: item, value: item} as DropdownItemProps))
                      }
            />
        )
    }
}