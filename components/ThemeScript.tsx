// Inline script that runs before React hydrates — sets data-theme on <html>
// from localStorage so the page never flashes the wrong theme.
export default function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('bible-theme');if(t==='parchment'||t==='codex'||t==='sanctuary'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','parchment');}}catch(e){document.documentElement.setAttribute('data-theme','parchment');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
