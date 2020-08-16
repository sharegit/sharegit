using Core.Util;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using ShareGithub;
using ShareGithub.Models;
using ShareGithub.Repositories;
using ShareGithub.Services;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "jwt")]
    public class DashboardController : ControllerBase
    {
        private IRepository<Account, AccountDatabaseSettings> AccountRepository { get; }
        private IAccountService AccountService { get; }

        public DashboardController(IAccountService accountService,
            IRepository<Account, AccountDatabaseSettings> accountRepository)
        {
            AccountService = accountService;
            AccountRepository = accountRepository;
        }

        [HttpGet()]
        [Produces("application/json")]
        public async Task<IActionResult> Get()
        {
            var userId = HttpContext.User.Claims.FirstOrDefault(x=>x.Type == ClaimTypes.NameIdentifier);
            var user = AccountRepository.Get(userId.Value);
            return new OkObjectResult(new
            {
                name = user.Name
            });
        }
    }
}
