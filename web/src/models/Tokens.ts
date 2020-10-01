import { Branch } from "./API";

export interface TokenRepo {
    name: string;
    owner: string;
    provider: string;
    downloadable: boolean;
    path: string;
}
export interface Token {
    token: string;
    author: string;
    repositories: TokenRepo[];
    customName: string;
    tokenExp?: Date;
    firstOpenDate: Date;
}

export function compareTokens(a: Token, b: Token) {
    if (a.firstOpenDate == undefined || a.firstOpenDate < b.firstOpenDate) 
        return 1;
    if (b.firstOpenDate == undefined || a.firstOpenDate > b.firstOpenDate)
        return -1;
    
    return 0;
}

export function getSharedPathType(path: string | undefined): 'tree' | 'blob' {
    if(path == undefined || path.endsWith("/"))
        return 'tree';
    else
        return 'blob';
}
export function getAdditionalPath(path: string | undefined): '' | string {
    if(path == undefined)
        return '';
    else if (path[path.length-1] == '/') {
        return `/${path.substring(0, path.length-1)}`;
    } else {
        return `/${path}`;
    }
}
export function getPreferredSha(branches: Branch[]): string {
    const master = branches.find(x=>x.name == 'master');
    if(master != undefined) {
        return master.name;
    }
    else {
        const def = branches.find(x=>x.name == 'default');
        if(def != undefined) {
            return def.name;
        }
        else {
            return branches[0].name;
        }
    }
}