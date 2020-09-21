import React from 'react';
import { Form, Label } from 'semantic-ui-react';

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
    renderInputElement() {
        switch(this.props.type) {
            case 'field':
                return (
                    <input onClick={(e) => e.stopPropagation()} name={this.props.id} value={this.props.value} onChange={(e) => {
                        e.stopPropagation();
                        this.props.onChanged(this.props.id, e.target.value);
                    }} placeholder={this.props.placeholder} />
                );
            case 'area':
                return (
                    <textarea onClick={(e) => e.stopPropagation()} name={this.props.id} value={this.props.value} onChange={(e) => {
                        e.stopPropagation();
                        this.props.onChanged(this.props.id, e.target.value);
                    }} placeholder={this.props.placeholder} />
                )
        }
    }
    render() {
        return (
            <Form.Field id={this.props.id}>
                <label>{this.props.label}</label>
                {!!this.props.error && 
                    <Label content={this.props.error} color='red' pointing='below'></Label>}
                {this.renderInputElement()}
                {this.props.description != undefined &&
                    <span>{this.props.description}</span>}
            </Form.Field>
        )
    }
}