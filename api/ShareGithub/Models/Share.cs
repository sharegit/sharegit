using System;
using System.Collections.Generic;
using System.Text;

namespace ShareGithub.Models
{
    public class Share : DbItemBase
    {
        public string Token { get; set; }
        public Repository[] AccessibleRepositories { get; set; }
    }
}
