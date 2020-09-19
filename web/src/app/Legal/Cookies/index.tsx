import React from 'react';

interface IProps {

}

export default class Cookies extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render() {
        return(
            <div>
                <h2>Cookies</h2>
            </div>
        )
    }
}