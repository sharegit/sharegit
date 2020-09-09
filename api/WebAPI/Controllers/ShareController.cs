using Core.APIModels;
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
using System.Threading.Tasks;

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

        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        [HttpGet("{token}")]
        [Produces("application/json")]
        public async Task<ActionResult<SharedRepositories>> GetList(string token)
        {
            var share = await ShareRepository.GetAsync(token);
            var user = await AccountRepository.GetAsync(share.Token.SharingUserId);
            if (share != null && user != null && (share.Token.ExpireDate == 0 || share.Token.ExpireDate > DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60))
            {
                var accessibleRepositories = share.AccessibleRepositories;

                var providers = accessibleRepositories.GroupBy(x => x.Provider);
                List<SharedRepository> sharedRepositories = new List<SharedRepository>();
                foreach(var provider in providers)
                {
                    switch(provider.Key)
                    {
                        case "github":
                            var owners = provider.GroupBy(x => x.Owner).Select(x => x.Key).Distinct();

                            foreach (var owner in owners)
                            {
                                var ownerAccess = await RepositoryServiceGH.GetAccess(owner);

                                var repositoriesResponseGH = await RepositoryServiceGH.GetInstallationRepositories(ownerAccess);
                                foreach (var rep in repositoriesResponseGH.Value.Repositories)
                                {
                                    var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                                        x.Repo == rep.Name
                                     && x.Provider == provider.Key
                                     && x.Owner == rep.Owner.Login);
                                    if (dbRepo != null)
                                        sharedRepositories.Add(new SharedRepository()
                                        {
                                            Id = rep.Id,
                                            Description = rep.Description,
                                            Owner = rep.Owner.Login,
                                            Provider = provider.Key,
                                            Repo = rep.Name,
                                            DownloadAllowed = dbRepo.DownloadAllowed,
                                            Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                                        });
                                }
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
                                var repositoriesResponseGL = await RepositoryServiceGL.GetProjects(user.GitlabConnection.GitlabId, gitlabUserAccess);
                                foreach (var rep in repositoriesResponseGL.Value)
                                {
                                    var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                                        x.RepoId == rep.Id
                                     && x.Provider == provider.Key);
                                    if (dbRepo != null)
                                        sharedRepositories.Add(new SharedRepository()
                                        {
                                            Id = rep.Id,
                                            Description = rep.Description,
                                            Owner = rep.Namespace.Path,
                                            Provider = provider.Key,
                                            Repo = rep.Path,
                                            DownloadAllowed = dbRepo.DownloadAllowed,
                                            Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                                        });
                                }
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
                                var repositoriesResponseBB = await RepositoryServiceBB.GetRepositories(bitbucketUserAccess);
                                foreach (var rep in repositoriesResponseBB.Value.Values)
                                {
                                    var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                                        x.Owner== rep.Workspace.Slug
                                     && x.Repo == rep.Slug
                                     && x.Provider == provider.Key);
                                    if (dbRepo != null)
                                        sharedRepositories.Add(new SharedRepository()
                                        {
                                            // Id = rep.Id,
                                            Description = rep.Description,
                                            Owner = rep.Workspace.Slug,
                                            Provider = provider.Key,
                                            Repo = rep.Slug,
                                            DownloadAllowed = dbRepo.DownloadAllowed,
                                            Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                                        });
                                }
                            }
                            break;
                        default:
                            throw new ArgumentException("Invalid argument: provider: [" + provider.Key + "]");
                    }
                }
                

                return new SharedRepositories()
                {
                    Author = user.DisplayName,
                    AuthorBio = user.Bio,
                    AuthorWebsite = user.Url,
                    Repositories = sharedRepositories
                };
            }
            else
            {
                return new ForbidResult("token");
            }
        }
    }
}
