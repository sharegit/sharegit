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
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse);
            string accessTokensUrl = installation.access_tokens_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse);
            string accessToken = accessTokens.token;

            var branchesResponse = await RepositoryService.GetBranches(user, repo, accessToken);
            dynamic branches = JArray.Parse(branchesResponse);

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

        [HttpGet("{user}/{repo}/tree/{sha}/{**uri}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetRepo(string user, string repo, string sha, string uri)
        {
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse);
            string accessTokensUrl = installation.access_tokens_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse);
            string accessToken = accessTokens.token;

            var repositoryResponse = await RepositoryService.GetInstallationRepository(user, repo, accessToken);
            dynamic repository = JObject.Parse(repositoryResponse);
            string trees_url = repository.trees_url;
            trees_url = trees_url.Replace(@"{/sha}", $"/{sha}");

            var treeResponse = await RepositoryService.GetRepositoryTree(trees_url, accessToken, true);
            dynamic tree = JObject.Parse(treeResponse);
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
                            results.Add(node);
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
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse);
            string accessTokensUrl = installation.access_tokens_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse);
            string accessToken = accessTokens.token;

            var repositoryResponse = await RepositoryService.GetInstallationRepository(user, repo, accessToken);
            dynamic repository = JObject.Parse(repositoryResponse);
            string trees_url = repository.trees_url;
            trees_url = trees_url.Replace(@"{/sha}", @"/master");

            var treeResponse = await RepositoryService.GetRepositoryTree(trees_url, accessToken, false);

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = treeResponse;
            return Content(rawresponse, "application/json");
        }

        [HttpGet("{user}")]
        [Produces("application/json")]
        public async Task<ContentResult> GetReposOf(string user)
        {
            var installationResponse = await RepositoryService.GetInstallation(user);
            dynamic installation = JObject.Parse(installationResponse);
            string accessTokensUrl = installation.access_tokens_url;
            string repositoriesUrl = installation.repositories_url;

            var accessTokensResponse = await RepositoryService.GetAccessToken(accessTokensUrl);
            dynamic accessTokens = JObject.Parse(accessTokensResponse);
            string accessToken = accessTokens.token;

            var repositoriesResponse = await RepositoryService.GetInstallationRepositories(repositoriesUrl, accessToken);
            dynamic repositories = JObject.Parse(repositoriesResponse);
            List<string> repositoryUrls = new List<string>();
            foreach (dynamic rep in repositories.repositories)
            {
                string name = rep.html_url;
                repositoryUrls.Add(name);
            }

            //string rawresponse = JsonConvert.SerializeObject(repositoryUrls);
            string rawresponse = repositoriesResponse;
            return Content(rawresponse, "application/json");
        }

    }
}
