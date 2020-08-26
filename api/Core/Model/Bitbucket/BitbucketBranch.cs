namespace Core.Model.Bitbucket
{
    public class BitbucketBranch
    {
        public class TargetObj
        {
            public string Hash { get; set; }
        }
        public string Name { get; set; }
        public TargetObj Target { get; set; }
    }
}
