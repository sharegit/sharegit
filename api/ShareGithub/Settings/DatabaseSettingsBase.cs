namespace ShareGithub.Settings
{
    public class DatabaseSettingsBase
    {
        public string ConnectionString { get; set; }
        public string Database { get; set; }
        public string Collection { get; set; }
    }
}
