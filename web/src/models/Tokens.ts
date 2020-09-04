export interface TokenRepo {
    name: string;
    owner: string;
    provider: string;
    downloadable: boolean;
}
export interface Token {
    token: string;
    author: string;
    repositories: TokenRepo[];
}