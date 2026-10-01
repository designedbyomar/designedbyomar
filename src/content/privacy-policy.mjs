export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  subtitle: 'No creepy tracking',
  lastUpdated: 'May 8, 2026',
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
        'questions typed into the Ask box that it cannot safely answer, including the wording of the question; when the router identifies relevant published work, the question may also be sent to Groq with excerpts from only those case studies so a reply can be drafted',
      ],
    },
    {
      type: 'paragraph',
      text: 'This information is used to improve the site, portfolio, case studies, writing, performance, and overall experience. Analytics data is aggregated where applicable and is not used to personally identify visitors. I do not use analytics for advertising, profiling, retargeting, or tracking you across other websites.',
    },
    { type: 'heading', text: 'The Ask Box' },
    {
      type: 'paragraph',
      text: 'The answers in the Ask section are written in advance and reviewed by hand. Clicking one of the suggested questions, or typing the same reviewed question or alias with ordinary changes in casing, punctuation, apostrophes, or spacing, is answered in your browser: nothing is sent and nothing leaves this site.',
    },
    {
      type: 'paragraph',
      text: 'Anything else you type is sent to this site to be matched. Word overlap alone picked the wrong answer often enough to be a problem — it once answered “is he a manager” with a refusal to discuss employers — so the question is normally passed on to Groq along with the list of written questions, and a model says which one you are asking for. That list is questions only: no answer text, and nothing about you. If Groq cannot be reached, returns an invalid result, or the allowance is spent, the Ask box shows that it cannot answer rather than substituting a loosely related answer or citation.',
    },
    {
      type: 'paragraph',
      text: 'If no written answer fits, Groq may name one or two relevant case studies. Only then is the question sent again with excerpts from those named studies and any reviewed answer grounded entirely in the same studies. If the router says none apply or fails, no draft is attempted. A drafted reply is labelled as drafted and unreviewed wherever it appears, and citation links appear only for named studies the completed reply actually mentions. The wording of a question the Ask box cannot safely answer is also recorded in an analytics event, which is how I can see missing answers and routing failures. A question that does get a written answer is not recorded that way.',
    },
    {
      type: 'paragraph',
      text: 'Your question is not stored on this site, is not used to identify you, and is not used to train anything by me. If you declined analytics, no analytics event is sent. If you would rather not send a question anywhere at all, email me instead and it stays between us.',
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
    { type: 'heading', text: 'Legal Basis' },
    {
      type: 'paragraph',
      text: 'Where required by privacy laws, analytics cookies are used based on your consent. Contact messages are processed based on legitimate interest: responding to people who reach out about work, services, collaboration, hiring, or general inquiries.',
    },
    { type: 'heading', text: 'Sharing And Selling Data' },
    {
      type: 'paragraph',
      text: 'I do not sell your personal data. I do not share your personal data with advertisers. The third-party services currently used for analytics, performance measurement, and error monitoring are Google Analytics 4, Vercel Analytics, Vercel Speed Insights, and Sentry.',
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
