using Core.APIModels;
using Jose;
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
    public class ShareController
    {
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepositoryService RepositoryService { get; }

        public ShareController(IRepositoryService repositoryService,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            ShareRepository = shareRepository;
            RepositoryService = repositoryService;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        [HttpGet("{token}")]
        [Produces("application/json")]
        public async Task<ActionResult<IEnumerable<SharedRepository>>> GetList(string token)
        {
            var share = ShareRepository.Find(x => x.Token == token);
            if (share != null)
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
                        if (accessibleRepositories.Any(x =>
                            x.Repo == rep.Name
                         && x.Provider == "github"
                         && x.Owner == rep.Owner.Login))
                            sharedRepositories.Add(new SharedRepository()
                            {
                                Description = rep.Description,
                                Owner = rep.Owner.Login,
                                Provider = "github",
                                Repo = rep.Name
                            });
                    }
                }

                return new OkObjectResult(sharedRepositories);
            }
            else
            {
                return new ForbidResult("token");
            }
        }
    }
}
