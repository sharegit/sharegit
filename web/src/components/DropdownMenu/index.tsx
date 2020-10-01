import React, { RefObject, ComponentProps, ReactNode } from 'react';
import { Button, Popper, Grow, Paper, ClickAwayListener, MenuList } from '@material-ui/core';


interface IProps extends ComponentProps<any>, React.HTMLAttributes<HTMLDivElement>{
    buttonHeader: ReactNode;
    buttonClassName?: string;
}

interface IState {
    isMenuOpen: boolean;
    menuOpenRef: RefObject<any>;
}


export default class DropdownMenu extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            isMenuOpen: false,
            menuOpenRef: React.createRef()
        };
    }
    toggleOpen() {
        this.setState({
            isMenuOpen: !this.state.isMenuOpen
        });
    }
    close() {
        this.setState({
            isMenuOpen: false
        });
    }
    render() {
        return [
            <Button  className={this.props.buttonClassName}
            key='dropdown_button'
            ref={this.state.menuOpenRef}
            aria-controls={this.state.isMenuOpen ? "menu-list-grow" : undefined}
            aria-haspopup="true"
            onClick={this.toggleOpen.bind(this)} >
            {this.props.buttonHeader}
            </Button>,
            <Popper key='dropdown' className={this.props.className} open={this.state.isMenuOpen}  anchorEl={this.state.menuOpenRef.current} transition>
                {({ TransitionProps, placement }) => (
                    <Grow
                    {...TransitionProps}
                    style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                    >
                    <Paper>
                        <ClickAwayListener onClickAway={this.close.bind(this)}>
                        <MenuList autoFocusItem={this.state.isMenuOpen} onClick={this.close.bind(this)} id="menu-list-grow">
                            {this.props.children}
                        </MenuList>
                        </ClickAwayListener>
                    </Paper>
                    </Grow>
                )}
            </Popper>
        ];
    }   
}