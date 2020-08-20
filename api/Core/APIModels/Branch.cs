using System;
using System.Collections.Generic;
using System.Text;

namespace Core.APIModels
{
    public class Branch
    {
        public string Name { get; set; }
        public bool Snapshot { get; set; }
        public bool Sha { get; set; }
    }
}
