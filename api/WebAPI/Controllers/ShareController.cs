using Core.APIModels;
using Core.Exceptions;
using Core.Model.Bitbucket;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGit;
using ShareGit.Models;
using ShareGit.Repositories;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using WebAPI.Authentication;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ShareController : ControllerBase
    {
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepositoryServiceGithub RepositoryServiceGH { get; }
        private IRepositoryServiceGitlab RepositoryServiceGL { get; }
        private IRepositoryServiceBitbucket RepositoryServiceBB { get; }

        public ShareController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepositoryServiceBitbucket repositoryServiceBB,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            ShareRepository = shareRepository;
            AccountRepository = accountRepository;
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
            RepositoryServiceBB = repositoryServiceBB;
        }

        private bool IsTokenValid(ShareGit.Models.SharedToken token, string userId)
        {
            return ((token.ExpireDate == 0 || token.ExpireDate > DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60)
             || JWTAuthenticationHandler.GetAuthenticatedUserClaims(HttpContext.Request.Headers)?.GetValueOrDefault("id") == userId);
        }

        [HttpGet("{token}/meta")]
        [Produces("application/json")]
        public async Task<ActionResult<Core.APIModels.SharedToken>> GetInfo(string token)
        {
            var share = await ShareRepository.GetAsync(token);
            if(share == null)
                throw new NotFoundException();
            var user = await AccountRepository.GetAsync(share.Token.SharingUserId);
            if (user == null || !IsTokenValid(share.Token, user.Id))
                throw new NotFoundException();
            
            return new Core.APIModels.SharedToken()
            {
                Token = share.Token.Token,
                CustomName = share.Token.CustomName,
                ExpireDate = share.Token.ExpireDate,
                Author = user.DisplayName,
                AuthorBio = user.Bio,
                AuthorWebsite = user.Url
            };
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        [HttpGet("{token}")]
        [Produces("application/json")]
        public async Task<ActionResult<SharedRepositories>> GetList(string token)
        {
            var share = await ShareRepository.GetAsync(token);
            if (share == null)
                throw new NotFoundException();
            var user = await AccountRepository.GetAsync(share.Token.SharingUserId);
            if (user == null || !IsTokenValid(share.Token, user.Id))
                throw new NotFoundException();

            var accessibleRepositories = share.AccessibleRepositories;

            var providers = accessibleRepositories.GroupBy(x => x.Provider);
            List<SharedRepository> sharedRepositories = new List<SharedRepository>();

            List<Task<Core.Model.APIResponse<Core.Model.Github.GithubRepositories>>> githubResponses = new List<Task<Core.Model.APIResponse<Core.Model.Github.GithubRepositories>>>();
            Task<Core.Model.APIResponse<Core.Model.GitLab.GitlabProject[]>> gitlabResponse = null;
            Task<Core.Model.APIResponse<Core.Model.Bitbucket.PaginatedBitbucketResponse<BitbucketRepository>>> bitbucketResponse = null;
            foreach (var provider in providers)
            {
                switch(provider.Key)
                {
                    case "github":
                        var owners = provider.GroupBy(x => x.Owner).Select(x => x.Key).Distinct();

                        foreach (var owner in owners)
                        {
                            var ownerAccess = await RepositoryServiceGH.GetAccess(owner);

                            githubResponses.Add(RepositoryServiceGH.GetInstallationRepositories(ownerAccess));
                        }
                        break;
                    case "gitlab":
                        if (user.GitlabConnection != null)
                        {
                            var gitlabUserAccess = new GitlabUserAccess()
                            {
                                UserId = user.Id,
                                AccessToken = JWT.Decode<string>(user.GitlabConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                            };
                            gitlabResponse = RepositoryServiceGL.GetProjects(user.GitlabConnection.GitlabId, gitlabUserAccess);
                        }
                        break;
                    case "bitbucket":
                        if(user.BitbucketConnection != null)
                        {
                            var bitbucketUserAccess = new BitbucketUserAccess()
                            {
                                UserId = user.Id,
                                AccessToken = JWT.Decode<string>(user.BitbucketConnection.EncodedAccessToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                                RefreshToken = JWT.Decode<string>(user.BitbucketConnection.EncodedRefreshToken, RollingEnv.Get("SHARE_GIT_API_PRIV_KEY_LOC")),
                                AccessTokenExp = user.BitbucketConnection.AccessTokenExp
                            };
                            bitbucketResponse = RepositoryServiceBB.GetRepositories(bitbucketUserAccess);
                        }
                        break;
                    default:
                        throw new ArgumentException("Invalid argument: provider: [" + provider.Key + "]");
                }
            }
            if(gitlabResponse != null)
            {
                var repositoriesResponseGL = await gitlabResponse;
                foreach (var rep in repositoriesResponseGL.Value)
                {
                    var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                        x.RepoId == rep.Id
                        && x.Provider == "gitlab");
                    if (dbRepo != null)
                        sharedRepositories.Add(new SharedRepository()
                        {
                            Id = rep.Id,
                            Description = rep.Description,
                            Owner = rep.Namespace.Path,
                            Provider = "gitlab",
                            Repo = rep.Path,
                            Path = dbRepo.Path,
                            DownloadAllowed = dbRepo.DownloadAllowed,
                            Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                        });
                }
            }

            if (githubResponses.Any())
            {
                var repositoriesResponsesGH = await Task.WhenAll(githubResponses);
                foreach (var repositoriesResponseGH in repositoriesResponsesGH)
                {
                    foreach (var rep in repositoriesResponseGH.Value.Repositories)
                    {
                        var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                            x.Repo == rep.Name
                            && x.Provider == "github"
                            && x.Owner == rep.Owner.Login);
                        if (dbRepo != null)
                            sharedRepositories.Add(new SharedRepository()
                            {
                                Id = rep.Id,
                                Description = rep.Description,
                                Owner = rep.Owner.Login,
                                Provider = "github",
                                Repo = rep.Name,
                                Path = dbRepo.Path,
                                DownloadAllowed = dbRepo.DownloadAllowed,
                                Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                            });
                    }
                }
            }

            if (bitbucketResponse != null)
            {
                var repositoriesResponseBB = await bitbucketResponse;

                foreach (var rep in repositoriesResponseBB.Value.Values)
                {
                    var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                        x.Owner == rep.Workspace.Slug
                        && x.Repo == rep.Slug
                        && x.Provider == "bitbucket");
                    if (dbRepo != null)
                        sharedRepositories.Add(new SharedRepository()
                        {
                            // Id = rep.Id,
                            Description = rep.Description,
                            Owner = rep.Workspace.Slug,
                            Provider = "bitbucket",
                            Repo = rep.Slug,
                            Path = dbRepo.Path,
                            DownloadAllowed = dbRepo.DownloadAllowed,
                            Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                        });
                }
            }
            
            return new SharedRepositories()
            {
                Repositories = sharedRepositories
            };
        }
    }
}
