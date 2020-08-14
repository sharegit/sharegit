using Core.APIModels;
using Jose;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebAPI.Settings;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ShareController
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IRepository<Share, ShareDatabaseSettings> ShareRepository { get; }
        private IRepositoryService RepositoryService { get; }

        public ShareController(IRepositoryService repositoryService,
            IRepository<Account, AccountDatabaseSettings> accountRepository,
            IRepository<Share, ShareDatabaseSettings> shareRepository)
        {
            AccountRepository = accountRepository;
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

                // TOOD: collect users and providers that this token gives access to
                // For now just the the user and assume github
                var owner = accessibleRepositories.GroupBy(x => x.Owner).Select(x => x.Key).Distinct().FirstOrDefault();

                var ownerAccess = await RepositoryService.GetAccess(owner);

                var repositoriesResponse = await RepositoryService.GetInstallationRepositories(ownerAccess.AccessToken);
                dynamic repositories = Newtonsoft.Json.Linq.JObject.Parse(repositoriesResponse.RAW);
                List<SharedRepository> sharedRepositories = new List<SharedRepository>();
                foreach (dynamic rep in repositories.repositories)
                {
                    string n = rep.name;
                    string o = rep.owner.login;
                    string d = rep.description;

                    if (accessibleRepositories.Any(x => x.Repo == n && x.Provider == "github" && x.Owner == o))
                        sharedRepositories.Add(new SharedRepository()
                        {
                            Description = d,
                            Owner = o,
                            Provider = "github",
                            Repo = n
                        });
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
