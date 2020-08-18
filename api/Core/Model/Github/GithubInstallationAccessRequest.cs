using System;
using System.Collections.Generic;
using System.Text;

namespace Core.Model.Github
{
    public class GithubInstallationAccessRequest
    {
        public string Token { get; set; }
        public string ExpiresAt { get; set; }
    }
}
