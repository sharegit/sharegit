namespace Core.APIModels
{
    public class DashboardAnalyticsInfo
    {
        public class Analytic
        {
            public string Token { get; set; }
            public int PageViews { get; set; } = 0;
            public int UniquePageViews { get; set; } = 0;
        }
        public Analytic[] Analytics { get; set; } = new Analytic[0];
    }
}
