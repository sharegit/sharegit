using Core.APIModels;
using Jose;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ShareController : ControllerBase
    {
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepositoryService RepositoryService { get; }

        public ShareController(IRepositoryService repositoryService,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            ShareRepository = shareRepository;
            AccountRepository = accountRepository;
            RepositoryService = repositoryService;
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

                // TOOD: collect providers that this token gives access to
                // For now just collecting the users and assume github
                var owners = accessibleRepositories.GroupBy(x => x.Owner).Select(x => x.Key).Distinct();
                List<SharedRepository> sharedRepositories = new List<SharedRepository>();

                foreach (var owner in owners)
                {
                    var ownerAccess = await RepositoryService.GetAccess(owner);

                    var repositoriesResponse = await RepositoryService.GetInstallationRepositories(ownerAccess);
                    foreach (var rep in repositoriesResponse.Value.Repositories)
                    {
                        var dbRepo = accessibleRepositories.FirstOrDefault(x =>
                            x.Repo == rep.Name
                         && x.Provider == "github"
                         && x.Owner == rep.Owner.Login);
                        if (dbRepo != null)
                            sharedRepositories.Add(new SharedRepository()
                            {
                                Description = rep.Description,
                                Owner = rep.Owner.Login,
                                Provider = "github",
                                Repo = rep.Name,
                                Branches = dbRepo.Branches.Select(x => new Branch() { Name = x }).ToArray()
                            });
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
