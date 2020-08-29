namespace EmailTemplates.ViewModels
{
    /// <summary>ViewModel for a confirmation type email</summary>
    public class ConfirmationViewModel
    {
        /// <summary>Title of the page</summary>
        public string Title { get; set; }

        /// <summary>PreHeader for this email</summary>
        public string PreHeader { get; set; }

        /// <summary>Hero at the top of this email</summary>
        public string Hero { get; set; }

        /// <summary>Disclaimers in the footer</summary>
        public string EmailDisclaimer { get; set; }

        /// <summary>Greeting for the reader</summary>
        public string Greeting { get; set; }

        /// <summary>First paragraph</summary>
        public string Intro { get; set; }

        /// <summary>Greeting at the end</summary>
        public string Cheers { get; set; }

        /// <summary>Text in case the button doesn't work for the user what to do</summary>
        public string BadButton { get; set; }

        /// <summary>Button for confitming the subject</summary>
        public EmailButtonViewModel Button { get; set; }

        /// <summary>Team name</summary>
        public string ShareGitTeam { get; set; }

        /// <summary>Base URL for the website for static resources</summary>
        public string SiteBaseUrl { get; set; }
    }
}