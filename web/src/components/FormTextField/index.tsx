import React from 'react';
import { TextField } from '@material-ui/core';

interface IProps {
    value: string | undefined;
    type: 'field' | 'area';
    label: string;
    error: string | undefined
    id: string;
    onChanged: (id: string, newValue: string) => void;
    description?: string;
    placeholder?: string;
}

interface IState {
}

export default class FormTextField extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return (
            <TextField id={this.props.id}
                        label={this.props.label}
                        value={this.props.value}
                        helperText={<span>{this.props.error} {!!this.props.error && <br />}{this.props.description}</span>}
                        multiline={this.props.type == 'area'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation();
                            this.props.onChanged(this.props.id, e.target.value);
                        }}
                        fullWidth
                        placeholder={this.props.placeholder}
                        error={!!this.props.error}
                        >
            </TextField>
        )
    }
}