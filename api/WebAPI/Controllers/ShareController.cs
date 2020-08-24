using Core.APIModels;
using Core.Model.GitLab;
using Core.Util;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Settings;
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

        public ShareController(IRepositoryServiceGithub repositoryServiceGH,
            IRepositoryServiceGitlab repositoryServiceGL,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            ShareRepository = shareRepository;
            AccountRepository = accountRepository;
            RepositoryServiceGH = repositoryServiceGH;
            RepositoryServiceGL = repositoryServiceGL;
        }
        [HttpGet("branches/{owner}/{repo}")]
        [Authorize(AuthenticationSchemes = "token")]
        public async Task<ActionResult<IEnumerable<Branch>>> GetSharedBranches(string owner, string repo)
        {
            if (HttpContext.Items.ContainsKey("access"))
            {
                var repos = HttpContext.Items["access"] as ShareGithub.Models.Repository[];
                var sharedRepo = repos.FirstOrDefault(x => x.Owner == owner && x.Repo == repo);
                if (sharedRepo != null)
                    return sharedRepo.Branches.Select(x => new Branch()
                    {
                        Name = x
                    }).ToArray();
            }
            return new ForbidResult("token");
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        [HttpGet("{token}")]
        [Produces("application/json")]
        public async Task<ActionResult<SharedRepositories>> GetList(string token)
        {
            var share = ShareRepository.Find(x => x.Token.Token == token);
            var user = AccountRepository.Get(share.Token.SharingUserId);
            if (share != null && user != null)
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
                                            Owner = rep.Owner.Name,
                                            Provider = provider.Key,
                                            Repo = rep.Name,
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
