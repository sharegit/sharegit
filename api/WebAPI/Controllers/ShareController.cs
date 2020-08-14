using Core.APIModels;
using Jose;
using Microsoft.AspNetCore.Mvc;
using ShareGithub;
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
        /// <summary>
        /// 
        /// </summary>
        /// <param name="token"></param>
        [HttpGet("{token}")]
        [Produces("application/json")]
        public async Task<IEnumerable<SharedRepository>> GetList(string token)
        {
            // TODO: look up entries that this token has access to
            if (token == "563b952ec30fb6ebd48a598f4246ab0334cf70c90d93f48b1f410d814436438a")
            {
                // Let's say this token has access to 'g-jozsef' user's 'test-repository' from 'github'
                return new SharedRepository[1] {
                    new SharedRepository()
                    {
                        Owner = "g-jozsef",
                        Provider = "github",
                        Repo = "test-repository",
                    }
                };
            }
            else
            {
                return new SharedRepository[0];
            }
        }
    }
}
