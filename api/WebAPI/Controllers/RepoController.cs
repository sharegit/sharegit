using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Core.Model;
using Jose;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using ShareGithub;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class RepoController : ControllerBase
    {
        private IRepositoryService RepositoryService { get; }
        public RepoController(IRepositoryService repositoryService)
        {
            RepositoryService = repositoryService;
        }

        [HttpGet("{user}/{repo}/branches")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepoBranches(string user, string repo)
        {
            var accessToken = await GetAccessToken(user);

            var branchesResponse = await RepositoryService.GetBranches(user, repo, accessToken);
            dynamic branches = JArray.Parse(branchesResponse.RAW);

            List<string> results = new List<string>();
            foreach (dynamic branch in branches)
            {
                string branchName = branch.name;
                results.Add(branchName);
            }

            string rawresponse = JsonConvert.SerializeObject(results);
            //string rawresponse = branchesResponse;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}/{repo}/blob/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepoBlob(string user, string repo, string sha, string uri)
        {
            var accessToken = await GetAccessToken(user);

            var contentResponse = await RepositoryService.GetContent(user, repo, sha, uri, accessToken);
            dynamic content = JObject.Parse(contentResponse.RAW);

            var result = new
            {
                file = content.path,
                content = content.content
            };

            string rawresponse = JsonConvert.SerializeObject(result);
            //string rawresponse = contentResponse.RAW;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        // TODO: Refactor with https://docs.github.com/en/rest/reference/repos#contents
        public async Task<ContentResult> GetRepo(string user, string repo, string sha, string uri)
        {
            var accessToken = await GetAccessToken(user);

            var repositoryResponse = await RepositoryService.GetInstallationRepository(user, repo, accessToken);
            dynamic repository = JObject.Parse(repositoryResponse.RAW);
            string trees_url = repository.trees_url;
            trees_url = trees_url.Replace(@"{/sha}", $"/{sha}");

            var treeResponse = await RepositoryService.GetRepositoryTree(trees_url, accessToken, true);
            dynamic tree = JObject.Parse(treeResponse.RAW);
            uri = uri?.TrimEnd('/') ?? "";
            List<dynamic> results = new List<dynamic>();
            foreach (dynamic node in tree.tree)
            {
                string path = node.path;
                if (path.StartsWith(uri))
                {
                    var prefixRemoved = path.Remove(0, uri.Length);
                    if (prefixRemoved.Length > 0)
                    {
                        // Remove first '/'
                        prefixRemoved = prefixRemoved.Remove(0, 1);
                        int nextSlash = prefixRemoved.IndexOf('/');
                        // It is in this folder
                        if (nextSlash == -1)
                        {
                            string type = node.type;
                            string nodeSha = node.sha;

                            var commitsResponse = await RepositoryService.GetCommits(user, repo, sha, path, accessToken);
                            // TODO: not sure if commit response order is guarenteed or not!
                            dynamic commitsJA = JArray.Parse(commitsResponse.RAW).OrderByDescending(x => (x as dynamic).commit.author.date);
                            dynamic lastCommit = null;
                            foreach(var commit in commitsJA) {
                                lastCommit = commit;
                                break;
                            }
                            string lastmodifydate = lastCommit.commit.author.date;
                            string lastmodifycommitmessage = lastCommit.commit.message;
                            string author = lastCommit.commit.author.name;

                            results.Add(new
                            {
                                path = path,
                                type = type,
                                sha = nodeSha,
                                author = author,
                                lastmodifydate = lastmodifydate,
                                lastmodifycommitmessage = lastmodifycommitmessage,
                                //commit = lastCommit
                            });
                        }
                        // There are more folders to go
                        else
                        {

                        }
                    }
                }
            }

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = JsonConvert.SerializeObject(results);
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}/{repo}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepo(string user, string repo)
        {
            var accessToken = await GetAccessToken(user);

            var repositoryResponse = await RepositoryService.GetInstallationRepository(user, repo, accessToken);
            dynamic repository = JObject.Parse(repositoryResponse.RAW);
            string trees_url = repository.trees_url;
            trees_url = trees_url.Replace(@"{/sha}", @"/master");

            var treeResponse = await RepositoryService.GetRepositoryTree(trees_url, accessToken, false);

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = treeResponse.RAW;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetReposOf(string user)
        {
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse.RAW);
            string accessTokensUrl = installation.access_tokens_url;
            string repositoriesUrl = installation.repositories_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse.RAW);
            string accessToken = accessTokens.token;

            var repositoriesResponse = await RepositoryService.GetInstallationRepositories(repositoriesUrl, accessToken);
            dynamic repositories = JObject.Parse(repositoriesResponse.RAW);
            List<string> repositoryUrls = new List<string>();
            foreach (dynamic rep in repositories.repositories)
            {
                string name = rep.html_url;
                repositoryUrls.Add(name);
            }

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = repositoriesResponse.RAW;
            return Content(rawresponse, "application/json");
        }

        private async Task<string> GetAccessToken(string user)
        {
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse.RAW);
            string accessTokensUrl = installation.access_tokens_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse.RAW);
            string accessToken = accessTokens.token;

            return accessToken;
        }
    }
}
