namespace Core.APIModels
{
    public class DashboardAnalyticsInfo
    {
        public class Analytic
        {
            public string Token { get; set; }
            public int PageViews { get; set; }
            public int UniquePageViews { get; set; }
        }
        public Analytic[] Analytics { get; set; }
    }
}
