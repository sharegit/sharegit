import { ReactNode } from "react";

interface IProps {
    filetype: string;
    content: string;
}

export default abstract class FileViewDriver {
    protected props: IProps
    constructor(props: IProps) {
        this.props = props;
        console.log('Created a driver with the following props');
        console.log(props);
    }

    public abstract render(): ReactNode
}