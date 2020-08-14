namespace ShareGithub
{

    public interface IDatabaseSettings
    {
        string ConnectionString { get; set; }
        string Database { get; set; }
        string Collection { get; set; }
    }
}
