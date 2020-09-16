import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from 'semantic-ui-react'

interface IState {
    restricted?: string;
}

interface IProps {
    provider: string;
    id: number;
    user: string;
    repo: string;
    sha: string;
    path: string;
    type: 'tree' | 'blob';
    token: string;
    restricted?: string;
}

export default class Path extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        
        if(props.restricted != undefined && props.restricted != null) {
            if (props.restricted[props.restricted.length-1] == '/') {
                this.state = {
                    restricted: props.restricted.substring(0, props.restricted.length - 1)
                }
            } else {
                this.state = {
                    restricted: props.restricted
                }
            }
        } else {
            this.state = { }
        }
    }

    private build(): ReactElement<typeof Breadcrumb.Section>[] {
        let path = this.props.path.split('/')
        let restriction = this.state.restricted == undefined ? [] : this.state.restricted.split('/')

        if (path.length == 1) {
            return [<Breadcrumb.Section key={path[0]} active>{path[0]}</Breadcrumb.Section>]
        }

        let link = `/${this.props.provider}/${this.props.id}/${this.props.user}/${this.props.repo}/${'tree'}/${this.props.sha}`
        let crums: ReactElement<typeof Breadcrumb.Section>[] = []
        
        if(restriction.length == 0)
            crums.push(<Breadcrumb.Section key={path[0]}><Link to={`${link}?token=${this.props.token}`}>{path[0]}</Link></Breadcrumb.Section>);
        
        path = path.slice(1)

        while (path.length > 0) {
            console.log(`${path[0]} - ${restriction[0]}`);
            if (path.length == 1) {    
                crums.push(<Breadcrumb.Section key={`${path[0]}_${path.length}`} active>{path[0]}</Breadcrumb.Section>)
            } else {
                link = `${link}/${path[0]}`
                if(restriction.length <= 1 || path[0] != restriction[0]) {
                    crums.push(<Breadcrumb.Section key={`${path[0]}_${path.length}`}><Link to={`${link}?token=${this.props.token}`}>{path[0]}</Link></Breadcrumb.Section>)
                }
            }
            path = path.slice(1)
            restriction = restriction.slice(1)
        }

        return crums
    }

    render() {
        return (
            <Breadcrumb>
                {this.build().map((content) =>
                    <React.Fragment key={content.key != null ? content.key : ''}>
                        <Breadcrumb.Divider />
                        {content}
                    </React.Fragment>
                )}
                {
                    this.props.type == 'tree' ? <Breadcrumb.Divider /> : null
                }
            </Breadcrumb>
        )
    }
}
