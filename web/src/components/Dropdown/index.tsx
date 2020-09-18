import React from 'react';
import {Dropdown as SemanticDropdown} from 'semantic-ui-react';

type DropdownValue = boolean | number | string | undefined;

export interface DropdownOption {
    key: string;
    value: DropdownValue;
    display: string;
}

interface IProps {
    onChange?: (value: DropdownValue | string[]) => void;
    onAddItem?: (value: DropdownValue | string[]) => void;
    defaultValue?: DropdownValue;
    options: Array<DropdownOption>
    // Allow searching
    search?: boolean;
    // Allow selecting
    selection?: boolean;
    // Allow multiple selections
    multiple?: boolean;
    // Allow adding custom items
    allowAdditions?: boolean;
    value?: DropdownValue | string[];
    placeholder?: string;
}

export default class Dropdown extends React.Component<IProps> {
    render() {
        return (
            <SemanticDropdown
                value={this.props.value}
                placeholder={this.props.placeholder}
                search={this.props.search}
                selection={this.props.selection}
                multiple={this.props.multiple}
                allowAdditions={this.props.allowAdditions}
                onChange={(event, data) => {
                    if(this.props.onChange != undefined)
                        this.props.onChange(data.value);
                }}
                onAddItem={(event, data) => {
                    if(this.props.onAddItem != undefined)
                        this.props.onAddItem(data.value);
                }}
                defaultValue={this.props.defaultValue}
                options={this.props.options.map(x=>({key:x.key, value: x.value, text: x.display}))} />
        );
    }
}