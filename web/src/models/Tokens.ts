export interface TokenRepo {
    name: string;
    owner: string;
    provider: string;
}
export interface Token {
    token: string;
    author: string;
    repositories: TokenRepo[];
}