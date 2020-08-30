namespace EmailTemplates.ViewModels
{
    /// <summary>ViewModel for a button in an email</summary>
    public class EmailButtonViewModel
    {
        /// <summary>Text written on the button</summary>
        public string Text { get; set; }

        /// <summary>Url that this button direct to when clicked</summary>
        public string Url { get; set; }
    }
}