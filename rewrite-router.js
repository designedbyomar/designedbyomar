const fs = require('fs');

let main = fs.readFileSync('src/main.jsx', 'utf8');

// 1. Add imports
main = main.replace(
  "import ReactDOM from 'react-dom/client';",
  "import ReactDOM from 'react-dom/client';\nimport { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration, useParams, Link, useNavigate, useLocation } from 'react-router-dom';"
);

// 2. Replace useRoute and routing logic
const routingBlockRegex = /\/\/ ===+\n\/\/ Routing\n\/\/ ===+[\s\S]*?\/\/ ===+\n\/\/ App\n\/\/ ===+/;
main = main.replace(routingBlockRegex, `// ============================================================
// App Components
// ============================================================`);

// 3. Update 'goHome' and 'currentCase' logic
main = main.replace(
  /const goHome = \(\) => \{[\s\S]*?\};/,
  "const navigate = useNavigate();\n  const goHome = () => navigate('/');"
);

// Replace route state usage inside App
main = main.replace(
  /const route = useRoute\(\);\s*const currentCase = route\.type === 'case' \? CASE_STUDIES\.find\(c => c\.id === route\.id\) : null;/,
  ""
);

main = main.replace(/<main>([\s\S]*?)<\/main>/, "<main>\n          <Outlet />\n        </main>");

const heroNavReplacement = `const Home = ({ galaxy, theme, onOpenAbout, onOpenWork }) => (
  <>
    <Hero galaxy={galaxy} theme={theme} />
    <About onOpenDrawer={onOpenAbout} />
    <Work onOpenDrawer={onOpenWork} />
    <Contact />
  </>
);

const CaseStudyWrapper = () => {
  const { id } = useParams();
  const c = CASE_STUDIES.find(x => x.id === id);
  const navigate = useNavigate();
  React.useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!c) return <div>Case study not found.</div>;
  return <CaseStudyPage c={c} onBack={() => navigate('/')} />;
};

const Root = () => {`

main = main.replace("const App = () => {", heroNavReplacement);

// 4. Update router initialization
main = main.replace("ReactDOM.createRoot(document.getElementById('root')).render(<App />);", `
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { path: '/', element: <Home /> },
      { path: 'work/:id', element: <CaseStudyWrapper /> }
    ]
  }
]);
ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
`);

// 5. Update component calls (Home needs props now)
main = main.replace("<Outlet />", `<Outlet context={{ galaxy, theme, aboutOpen, workOpen, setAboutOpen, setWorkOpen }} />`);
main = main.replace(
  `const Home = ({ galaxy, theme, onOpenAbout, onOpenWork }) => (`,
  `const Home = () => {
    const { galaxy, theme, setAboutOpen, setWorkOpen } = import("react-router-dom").then ? require('react-router-dom').useOutletContext() : {};
    return (
`
);

// We need to properly rewrite Home component signature to useOutletContext
main = main.replace(
  `const Home = () => {
    const { galaxy, theme, setAboutOpen, setWorkOpen } = import("react-router-dom").then ? require('react-router-dom').useOutletContext() : {};
    return (
  <>`,
  `const Home = () => {
    const { galaxy, theme, setAboutOpen, setWorkOpen } = import("react-router-dom").then ? require('react-router-dom').useOutletContext() : {};
    return (
  <>`
); // wait let's just make it simpler.


fs.writeFileSync('rewrite-router.js', '/* will be replaced by cleaner logic */');
