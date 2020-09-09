import config from '../config'
import axios, {AxiosResponse, AxiosRequestConfig, AxiosError, CancelToken as AxiosCancelToken} from 'axios'
import Mutex from '../util/Mutex';
import RCache from './RCache';

export interface APIResponse<T = any> {
    data: T;
    statusCode: number;
}
export interface CancelToken {
    token: AxiosCancelToken,
    cancel: () => void
}
export interface SharedRepositories {
    repositories: SharedRepository[];
    author: string;
    authorWebsite: string;
    authorBio: string;
}
export interface SharedRepository {
    id: number;
    owner: string;
    repo: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
    downloadAllowed: boolean;
    description: string;
    snapshot: boolean;
    branches: Branch[];
}
export interface Repository {
    name: string;
    private: boolean;
    description: string;
}
export interface RepositoriesResponse {
    total_count: number;
    repositories: Repository[];
}
export interface BlobResult {
    file: string;
    content: string;
}
export interface TreeResult {
    treeNodes: TreeNode[];
}
export interface TreeNode {
    path: string;
    type: 'tree' | 'blob' | 'file' | 'dir';
    sha: string;
    author: string;
    lastModifyDate: string;
    lastModifyCommitMessage: string;
}
export interface AuthResult {
    token: string;
    // Expiring tokens turned off
    // exp: string;
}
export interface DashboardResponse {
    name: string;
}
export interface SharedToken {
    token: string;
    customName: string;
}
export interface Branch {
    name: string;
    snapshot: boolean;
    sha: boolean;
}

export interface Analytic {
    token: string;
    pageViews: string;
    uniquePageViews: string;
}
export interface DashboardAnalyticsInfo {
    analytics: Analytic[];
}
export interface GithubInstallations {
    installations: GithubInstallation[];
}
export interface GithubInstallation {
    login: string;
}

export interface AccountSettings {
    email?: string;
}
export interface ConnectedServices {
    githubLogin?: string;
    gitlabLogin?: string;
    bitbucketLogin?: string;
}
export interface PublicProfileSettings {
    displayName?: string;
    url?: string;
    bio?: string;
}

export default class API {
    static cache: RCache = new RCache('share-git');

    static aquireNewCancelToken(): CancelToken {
        return axios.CancelToken.source()
    }
    static populateDefaultRequest(cancelToken: CancelToken): AxiosRequestConfig {
        return {
            cancelToken: cancelToken.token,
            headers: {
                token: localStorage.getItem('token'),
                jwt: localStorage.getItem('OAuthJWT')
            }
        };
    }
    static wasCancelled(e: any): boolean {
        return axios.isCancel(e);
    }
    private static async request<T = any>(method: 'get' | 'delete' | 'post' | 'put', path: string, cancelToken: CancelToken, data?: any, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        const request = path.startsWith('/') ? `${config.apiUrl}${path}` : path;
        console.log(`Requesting: ${request}`);

        const axiosRequestCOnfig: AxiosRequestConfig = this.populateDefaultRequest(cancelToken)
        if (additionalConfig != undefined)
            Object.assign(axiosRequestCOnfig, additionalConfig);
        try {
            const result =
                method == 'get' ?
                await axios.get<T>(request, axiosRequestCOnfig)
            :   method == 'delete' ? 
                await axios.delete<T>(request, axiosRequestCOnfig)
            :   method == 'post' ?
                await axios.post<T>(request, data, axiosRequestCOnfig)
            :   method == 'put' ?
                await axios.put<T>(request, data, axiosRequestCOnfig)
            :   undefined;

            if (result != undefined && result.status >= 200 && result.status < 400) {
                console.log(`Got a response for ${request} (${result.status})`)
                return {
                    data: result.data,
                    statusCode: result.status
                }
            } else if(result != undefined) {
                console.error(`Error while requesting ${request} ${result.status}`)
                throw new Error(result.status.toString());
            } else {
                throw new Error(`Unknown error occurred during ${request}`);
            }
        } catch (error) {
            if (!this.wasCancelled(error)) {
                console.error(`Error while requesting ${request} ${error}`)
                throw (error);
            } else {
                // Intentionally not logging here, because cancallation is expected behaviour
                throw (error);
            }
        }
    }
    static async get<T = any>(path: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        return await this.request('get', path, cancelToken, undefined, additionalConfig);
    }
    static async delete<T = any>(path: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        return await this.request('delete', path, cancelToken, undefined, additionalConfig);
    }
    static async post<T = any>(path: string, data: any, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        return await this.request('post', path, cancelToken, data, additionalConfig);
    }
    static async put<T = any>(path: string, data: any, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<APIResponse<T>> {
        return await this.request('put', path, cancelToken, data, additionalConfig);
    }

    static async getData<T = any>(path: string, cancelToken: CancelToken, additionalConfig?: AxiosRequestConfig): Promise<T> {
        const result = await this.get<T>(path, cancelToken)
        return result.data;
    }
    static async getDataCached<T = any>(path: string, cancelToken: CancelToken, ttl: number = 3600): Promise<T> {
        return await this.cache.getOrPutAndGet<T>(path, 
            async () =>  (await this.getData<T>(path, cancelToken)),
            ttl);
    }

    static async getSharedBranches(owner: string, repo: string, cancelToken: CancelToken): Promise<Branch[]> {
        const requestPath = `/share/branches/${owner}/${repo}`;
        return await this.getDataCached<Branch[]>(requestPath, cancelToken, 3600);
    }
    static async getRepoTree(provider: string, id: number, owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<TreeNode[]> {
        const requestPath = `/${provider}/${id}/${owner}/${repo}/tree/${sha}/${uri}`;
        return await this.getDataCached<TreeNode[]>(requestPath, cancelToken, 3600);
    }
    static async getRepoBlob(provider: string, id: number, owner: string, repo: string, sha: string, uri: string, cancelToken: CancelToken): Promise<BlobResult> {
        const requestPath = `/${provider}/${id}/${owner}/${repo}/blob/${sha}/${uri}`;
        return await this.getDataCached<BlobResult>(requestPath, cancelToken, 3600);
    }
    static async getSharedRepositories(token: string, cancelToken: CancelToken): Promise<SharedRepositories> {
        const requestPath = `/share/${token}`;
        return await this.getDataCached<SharedRepositories>(requestPath, cancelToken, 60 * 5);
    }
    static async signIn(provider: string, code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const requestPath = `/auth/signin/${provider}/${code}/${state}`;
        return await this.getData<AuthResult>(requestPath, cancelToken);
    }
    static async signUp(provider: string, code: string, state: string, cancelToken: CancelToken): Promise<AuthResult> {
        const requestPath = `/auth/signup/${provider}/${code}/${state}`;
        return await this.getData<AuthResult>(requestPath, cancelToken);
    }
    static async fetchDashboardEssential(cancelToken: CancelToken): Promise<DashboardResponse> {
        const requestPath = `/dashboard`;
        return await this.getData<DashboardResponse>(requestPath, cancelToken);
    }
    static async getSharedTokens(cancelToken: CancelToken): Promise<SharedToken[]> {
        const requestPath = `/dashboard/tokens`;
        return await this.getData<SharedToken[]>(requestPath, cancelToken);
    }
    static async getMyRepos(cancelToken: CancelToken): Promise<SharedRepository[]> {
        const requestPath = `/dashboard/repos`;
        return await this.getData<SharedRepository[]>(requestPath, cancelToken);
    }
    static async createToken(tokenCreation: any, cancelToken: CancelToken): Promise<SharedToken> {
        const requestPath = `/dashboard/createtoken`;
        return (await this.post<SharedToken>(requestPath, tokenCreation, cancelToken)).data;
    }
    static async deleteToken(token: string, cancelToken: CancelToken): Promise<any> {
        const requestPath = `/dashboard/deletetoken/${token}`;
        return await this.post<any>(requestPath, {}, cancelToken);
    }
    static async startDeleteAccount(cancelToken: CancelToken): Promise<any> {
        const requestPath = `/settings`;
        return await this.put<any>(requestPath, {}, cancelToken);
    }
    static async deleteAccount(token: string, cancelToken: CancelToken): Promise<any> {
        const requestPath = `/settings/${token}`;
        return await this.delete<any>(requestPath, cancelToken);
    }
    static async getAnalytics(cancelToken: CancelToken): Promise<DashboardAnalyticsInfo> {
        const requestPath = `/dashboard/analytics`;
        return await this.getDataCached(requestPath, cancelToken, 3600);
    }
    static pushHit(path: string, cid: string, cancelToken: CancelToken): void {
        const requestPath = `/an/hit?path=${encodeURIComponent(path)}&cid=${encodeURIComponent(cid)}`;
        this.post(requestPath, {}, cancelToken);
    }
    static async getDownloadLink(provider: string, id: number, owner: string, repo: string, sha: string, cancelToken: CancelToken): Promise<string> {
        const requestPath = `/${provider}/download/${id}/${owner}/${repo}/${sha}`;
        return await this.getData<string>(requestPath, cancelToken);
    }
    static async getGithubInstallations(cancelToken: CancelToken): Promise<GithubInstallations> {
        const requestPath = `/settings/githubinstallations`;
        return await this.getData<GithubInstallations>(requestPath, cancelToken);
    }

    static async getSettingsPublicProfile(cancelToken: CancelToken): Promise<PublicProfileSettings> {
        const requestPath = `/settings/public`;
        return await this.getData<PublicProfileSettings>(requestPath, cancelToken);
    }
    static async setSettingsPublicProfile(newSettings: PublicProfileSettings, cancelToken: CancelToken): Promise<any> {
        const requestPath = `/settings/public`;
        return await this.put<any>(requestPath, newSettings, cancelToken);
    }
    static async getSettingsAccount(cancelToken: CancelToken): Promise<AccountSettings> {
        const requestPath = `/settings/account`;
        return await this.getData<AccountSettings>(requestPath, cancelToken);
    }
    static async setSettingsAccount(newSettings: AccountSettings, cancelToken: CancelToken): Promise<any> {
        const requestPath = `/settings/account`;
        return await this.put<any>(requestPath, newSettings, cancelToken);
    }
    static async getConnectedServices(cancelToken: CancelToken): Promise<ConnectedServices> {
        const requestPath = `/settings/connections`;
        return await this.getData<ConnectedServices>(requestPath, cancelToken);
    }
    static async disconnectService(provider: string, cancelToken: CancelToken) {
        const requestPath = `/settings/connection/${provider}`;
        return await this.delete<any>(requestPath, cancelToken);
    }
}