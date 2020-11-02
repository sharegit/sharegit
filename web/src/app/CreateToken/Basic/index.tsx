import React from 'react';
import FormTextField from 'components/FormTextField';
import { Checkbox, FormControlLabel, Button } from '@material-ui/core';
import DatePicker from "react-datepicker";
import Dropdown from 'components/Dropdown';
import printDate from 'util/Date';

interface IProps {
    customNameError: string | undefined;
    customNameValue: string;
    changeCustomName: (id: string, newValue: string) => void;

    privateNoteError: string | undefined;
    privateNoteValue: string;
    changeprivateNote: (id: string, newValue: string) => void;

    isExpiring: boolean;
    changeIsExpiring: (newValue: boolean) => void;

    defaultExpire: number | 'X';
    expireDate?: Date;
    expireDateChanged: (newValue: Date, value: number | 'X') => void;

    onNext: () => void;
}

interface IState {
    datePickerVisible: boolean;
    datePickerOpen: boolean;
}

export default class Basic extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            datePickerOpen: false,
            datePickerVisible: false
        }
    }
    render() {
        const fields = [
            <FormTextField  
                key='customName'
                id='customName'
                type='field'
                label='Custom Name'
                error={this.props.customNameError}
                value={this.props.customNameValue}
                onChanged={(id, newValue)=>this.props.changeCustomName(id, newValue)}
                placeholder='My token for company X'
                description='This name will be displayed to you as well as to the reciever as an easy name to remember when referring to this shared link in place of the random token.'
            />,
            <FormTextField  
                key='privateNote'
                id='privateNote'
                type='field'
                label='Note (private)'
                error={this.props.privateNoteError}
                value={this.props.privateNoteValue}
                onChanged={(id, newValue)=>this.props.changeprivateNote(id, newValue)}
                placeholder='My secret note...'
                description='You will see this note in your dashboard. This is a note for you to attach to this shared link.'
            />,
            <FormControlLabel
                key='isExpiring'
                control={<Checkbox checked={this.props.isExpiring} onChange={(e) => this.props.changeIsExpiring(e.target.checked)} name="isExpiring" />}
                label="Expiring token"
            />
        ]
        if (this.props.isExpiring) {
            fields.push(
                <div key='datePicker'>
                    <Dropdown
                        label='Expiration date'
                        helperText='Select the expiration date from the list or click custom to select date manually'
                        onChange={(data) => {
                            const current = new Date();
                            const newDate = data == 'X' ? 
                                new Date(current.getTime() + 60 * 24 * 60 * 1000)
                            :   new Date(current.getTime() + (data as number) * 60 * 1000);
                            this.props.expireDateChanged(newDate, data as number);
                            if (data == 'X') {
                                this.setState({
                                    datePickerVisible: true,
                                    datePickerOpen: true
                                });
                            } else {
                                this.setState({
                                    datePickerVisible: false
                                })
                            }
                        }}
                        defaultValue={this.props.defaultExpire}
                        options={[
                            { key: '1-day', value: 60 * 24, display: '1 day' },
                            { key: '1-week', value: 60 * 24 * 7, display: '1 week' },
                            { key: '1-month', value: 60 * 24 * 30, display: '1 month' },
                            { key: 'X', value: 'X', display: 'Custom' }
                    ]} />
                    {this.state.datePickerVisible === true &&
                        <DatePicker
                            open={this.state.datePickerOpen}
                            onInputClick={() => this.setState({datePickerOpen: true})}
                            selected={this.props.expireDate}
                            disabledKeyboardNavigation
                            startDate={this.props.expireDate}
                            endDate={this.props.expireDate}
                            highlightDates={this.props.expireDate == undefined ? [] : [this.props.expireDate]}
                            onChange={(newDate) => this.props.expireDateChanged(newDate as Date, 'X')}
                            onClickOutside={() => this.setState({datePickerOpen: false})}
                            minDate={new Date(new Date().getTime() + 60 * 24 * 60 *1000)}
                        />}
                    <p>Token will expire on: {this.props.expireDate != undefined ? printDate(this.props.expireDate) : ''}</p>
                </div>
            )
        }

        fields.push(
            <Button key='next' disabled={!!this.props.customNameError || !!this.props.privateNoteError || this.props.customNameValue.length == 0} onClick={() => this.props.onNext()}>
                Next
            </Button>
        )
        
        return fields;
    }
}