export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  subtitle: 'No creepy tracking',
  lastUpdated: 'November 10, 2026',
  blocks: [
    {
      type: 'paragraph',
      text: 'This site uses a very small amount of analytics to understand what people look at, what pages are useful, and where the experience can be improved.',
    },
    {
      type: 'list',
      items: [
        'No ads.',
        'No selling data.',
        'No tracking you across the internet.',
        'No weird stuff.',
      ],
    },
    {
      type: 'paragraph',
      text: 'The analytics are only here to help make the site better.',
    },
    { type: 'heading', text: 'Cookies' },
    {
      type: 'paragraph',
      text: 'This site may use cookies or similar technologies for analytics. When you visit the site, you may see a cookie banner that lets you choose whether to allow analytics cookies. If you decline, analytics will not run and the site will still work normally.',
    },
    {
      type: 'paragraph',
      text: 'You can change your choice at any time by clearing cookies or site data in your browser, or by adjusting your browser privacy settings.',
    },
    { type: 'heading', text: 'Analytics' },
    {
      type: 'paragraph',
      text: 'This site uses Google Analytics 4, Vercel Analytics, and Vercel Speed Insights to understand how people interact with the site, including things like:',
    },
    {
      type: 'list',
      items: [
        'which pages are visited',
        'what links or sections people engage with',
        'how long people stay',
        'what devices or browsers are being used',
        'general location, such as country or city-level information',
        'Ask answer IDs, nearest reviewed topic IDs, response outcomes, and failure categories; question text is not sent to analytics',
      ],
    },
    {
      type: 'paragraph',
      text: 'This information is used to improve the site, portfolio, case studies, writing, performance, and overall experience. Analytics data is aggregated where applicable and is not used to personally identify visitors. I do not use analytics for advertising, profiling, retargeting, or tracking you across other websites.',
    },
    { type: 'heading', text: 'The Ask Box' },
    {
      type: 'paragraph',
      text: 'Suggested questions and exact matches to reviewed questions are answered in your browser. Their wording is not sent to a model. Some factual questions about management experience are also answered locally.',
    },
    {
      type: 'paragraph',
      text: 'Other questions are sent through this site to Groq to find a relevant reviewed answer. If none fits, Groq may draft a reply using excerpts from relevant published case studies. Drafts are labelled as unreviewed and link to the studies they mention. If there is no supporting material, Ask says so. Connection failures offer a retry; a temporary usage limit asks you to wait or choose a suggested question.',
    },
    {
      type: 'paragraph',
      text: 'This processing is needed to answer your question and is separate from analytics consent. Please leave out personal or confidential information. This site does not store your questions or use them to train models. Groq processes questions under its cloud-service data terms.',
      link: { label: 'Groq data processing terms', href: 'https://console.groq.com/docs/legal/customer-data-processing-addendum' },
    },
    {
      type: 'paragraph',
      text: 'If you accept analytics, Ask records answer IDs, nearest reviewed topic IDs, outcomes, and failure categories to help improve coverage and reliability. It does not send your question text to analytics. If you decline analytics, these events are not sent. You can email Omar directly if you prefer a personal reply.',
    },
    { type: 'heading', text: 'Google Analytics 4' },
    {
      type: 'paragraph',
      text: "Google Analytics 4 helps measure site activity and performance. GA4 may use cookies to collect analytics information after you accept analytics. This data is processed by Google on my behalf and may be stored or processed in locations outside your country, depending on Google's systems and infrastructure.",
    },
    {
      type: 'paragraph',
      text: 'Google provides controls and safeguards for analytics data, including data retention settings and privacy-focused measurement options.',
    },
    { type: 'heading', text: 'Vercel Analytics And Speed Insights' },
    {
      type: 'paragraph',
      text: 'Vercel Analytics and Speed Insights help measure basic site performance and visitor behavior, such as page views, referrers, browser type, device information, and real-world performance metrics.',
    },
    {
      type: 'paragraph',
      text: 'They are used to understand how the site performs in the real world and to make improvements to speed, usability, and content.',
    },
    { type: 'heading', text: 'Sentry Error Monitoring' },
    {
      type: 'paragraph',
      text: 'This site uses Sentry for production error monitoring. Sentry only initializes after you accept analytics. It helps identify broken pages, JavaScript errors, browser context, route information, and theme state when something fails.',
    },
    {
      type: 'paragraph',
      text: 'Sentry is used to debug production issues and keep the site working. It is not used for advertising, profiling, or retargeting.',
    },
    { type: 'heading', text: 'Contact' },
    {
      type: 'paragraph',
      text: 'If you contact me through an email link or any other method on this site, I collect the information you choose to share, such as your name, email address, company, and message.',
    },
    {
      type: 'paragraph',
      text: 'That information is only used to respond to your inquiry and any related follow-up. I do not sell or share contact messages with advertisers. Messages may be stored in my email inbox or related communication tools for as long as needed to manage the conversation.',
    },
    {
      type: 'paragraph',
      text: 'The inquiry form sends your contact details, goals, timing, budget, and any optional company, website, or service information through Vercel to Resend for delivery to my inbox. Cloudflare Turnstile checks the form for abuse and processes verification and technical data, including your IP address; it does not receive the inquiry fields from this site. These services support responding to your inquiry and preventing spam, independently of your analytics choice. Form contents are not stored in browser storage or sent to analytics. Messages may remain in my inbox and email delivery records as needed to handle the conversation.',
    },
    { type: 'heading', text: 'Legal Basis' },
    {
      type: 'paragraph',
      text: 'Where required by privacy laws, analytics cookies are used based on your consent. Contact messages are processed based on legitimate interest: responding to people who reach out about work, services, collaboration, hiring, or general inquiries.',
    },
    { type: 'heading', text: 'Sharing And Selling Data' },
    {
      type: 'paragraph',
      text: 'I do not sell your personal data. I do not share your personal data with advertisers. The third-party services currently used for analytics, performance measurement, and error monitoring are Google Analytics 4, Vercel Analytics, Vercel Speed Insights, and Sentry. Vercel, Resend, and Cloudflare also process inquiry delivery or verification as described above.',
    },
    { type: 'heading', text: 'Your Rights' },
    {
      type: 'paragraph',
      text: 'Depending on where you live, you may have the right to request access to, correction of, or deletion of personal information connected to you. To make a request, contact me at ',
      link: {
        href: 'mailto:omar@designedbyomar.com',
        label: 'omar@designedbyomar.com',
      },
      suffix: '.',
    },
    { type: 'heading', text: 'Updates' },
    {
      type: 'paragraph',
      text: 'This policy may be updated occasionally as the site changes or as tools are added or removed. The latest version will always be available on this page.',
    },
  ],
};
