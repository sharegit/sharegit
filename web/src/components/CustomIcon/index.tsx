import React, { HTMLAttributes } from 'react';
import style from './style.scss';

interface IProps extends HTMLAttributes<HTMLDivElement> {
    src: string;
    alt?: string;
    size?: 'small' | 'medium' | 'large' | 'auto';
}

export default class CustomIcon extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    getSizeStyle() {
        switch(this.props.size) {
            case undefined: return style.auto;
            case 'auto': return style.auto;
            case 'small': return style.small;
            case 'medium': return style.medium;
            case 'large': return style.large;
        }
    }
    render(){
        return (
            <img
                id={this.props.id}
                className={`${style.img}
                            ${this.getSizeStyle()}
                            ${this.props.className == undefined ? '' : this.props.className}`}
                src={this.props.src}
                alt={this.props.alt}/>
        )
    }
}