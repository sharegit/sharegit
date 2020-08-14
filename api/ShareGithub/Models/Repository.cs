using System;
using System.Collections.Generic;
using System.Text;

namespace ShareGithub.Models
{
    public class Repository : DbItemBase
    {
        public string Owner { get; set; }
        public string Repo { get; set; }
        public string Provider { get; set; }
    }
}
