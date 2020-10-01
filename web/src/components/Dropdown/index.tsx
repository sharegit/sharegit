import React from 'react';
import {Autocomplete, createFilterOptions, AutocompleteRenderInputParams} from '@material-ui/lab'
import { TextField } from '@material-ui/core';

type DropdownValue = boolean | number | string | undefined;

export interface DropdownOption {
    key: string;
    value: DropdownValue;
    display: string;
}

interface IProps {
    className?: string;
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
    label: string;
    helperText: string;
}


export default class Dropdown extends React.Component<IProps> {
    overrideInput() {
        return (params: AutocompleteRenderInputParams) => (
            <TextField
                {...params}
                variant="standard"
                label={this.props.label}
                helperText={this.props.helperText}
                placeholder={this.props.placeholder}
            />
        )
    }
    getDefaultValue(): DropdownOption | DropdownOption[] | undefined {
        if (this.props.defaultValue == undefined)
            return undefined;

        const option = this.props.options.find(x=>x.value == this.props.defaultValue);
        if (option == undefined)
            return undefined;

        if (this.props.multiple)
            return [option];
        else
            return option;
    }
    render() {
        const filter = createFilterOptions<DropdownOption>();
        return (
            <Autocomplete
            className={this.props.className}
            multiple={this.props.multiple}
            onClick={(e) => e.stopPropagation()}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                if (this.props.allowAdditions)
                    if (params.inputValue !== '')
                        filtered.push({
                            key: params.inputValue,
                            value: params.inputValue,
                            display: `New Custom SHA "${params.inputValue}"`
                        });

                return filtered;
            }}
            onChange={(e, value) => {
                if (value != null) {
                    if (this.props.multiple === true) {
                        const option = (value as DropdownOption[]);
                        if(this.props.onAddItem) {
                            const missing = option.find(o=>!this.props.options.some(x=>x.value == o.value))
                            
                            if (missing != undefined) {
                                this.props.onAddItem(missing.value);
                            }
                        }

                        if(this.props.onChange) {
                            const currentValues = option.map(x=>x.value as string)
                            this.props.onChange(currentValues)
                        }
                    }
                    else {
                        const optionValue = (value as DropdownOption).value;
                        if(this.props.onAddItem)
                            if (!this.props.options.some(x=>x.value == optionValue))
                                this.props.onAddItem(optionValue);

                        if(this.props.onChange)
                            this.props.onChange(optionValue)   
                    }
                }
            }}
            options={this.props.options}
            value={this.props.value == undefined ? undefined : 
                this.props.multiple ? 
                (this.props.value as string[]).map(x=>({key: x, value: x, display: x}))
            :   ({key: this.props.value.toString(), value: this.props.value.toString(), display: this.props.value.toString()})}
            getOptionSelected={(option, value) => {
                return option.value == value.value;
            }}
            getOptionLabel={(option : DropdownOption) => option.display as string}
            defaultValue={this.getDefaultValue()}
            renderInput={this.overrideInput()}
            />
        );
    }
}
