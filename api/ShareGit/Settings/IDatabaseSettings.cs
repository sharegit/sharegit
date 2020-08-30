namespace ShareGit.Settings
{

    public interface IDatabaseSettings
    {
        string ConnectionString { get; set; }
        string Database { get; set; }
        string Collection { get; set; }
    }
}
