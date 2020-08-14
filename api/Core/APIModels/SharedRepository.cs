using System;
using System.Collections.Generic;
using System.Text;

namespace Core.APIModels
{
    public class SharedRepository
    {
        public string Owner { get; set; }
        public string Repo { get; set; }
        public string Provider { get; set; }
        public string Url { get; set; }
    }
}
