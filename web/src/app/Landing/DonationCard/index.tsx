import React, { ReactNode } from 'react';
import { Button } from 'semantic-ui-react';

interface IProps {
}

export default class DonationCard extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    render(): ReactNode {
        return (
            <div>
                <h3>We are an open source project</h3>
                <span><a href='https://github.com/sharegit/sharegit'>Check out ShareGit</a> on GitHub</span>
                <p>If you like our services, please consider supporting us.</p>
                <Button>Donate</Button>
            </div>
        )
    }
}