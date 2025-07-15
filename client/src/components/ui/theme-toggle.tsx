import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ position: "absolute", top: "9px", right: "140px" }}
    >
      <style>{`
        .theme-toggle-label {
          font-size: 10px;
          position: relative;
          display: inline-block;
          width: 2.5em;
          height: 1.5em;
          cursor: pointer;
        }
        .theme-toggle-checkbox {
          opacity: 0;
          width: 0;
          height: 0;
        }
        #container,
        #patches,
        #stars,
        #button,
        #sun,
        #moon,
        #cloud {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 0.25s;
        }
        .theme-toggle-checkbox:checked + svg #container {
          fill: #2b4360;
        }
        .theme-toggle-checkbox:checked + svg #button {
          transform: translate(10px, 1px);
        }
        #sun { opacity: 1; }
        .theme-toggle-checkbox:checked + svg #sun { opacity: 0; }
        #moon { opacity: 0; }
        .theme-toggle-checkbox:checked + svg #moon { opacity: 1; }
        #cloud { opacity: 1; }
        .theme-toggle-checkbox:checked + svg #cloud { opacity: 0; }
        #stars { opacity: 0; }
        .theme-toggle-checkbox:checked + svg #stars { opacity: 1; }
      `}</style>

      <label
        className="theme-toggle-label"
        title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        aria-label="Cambiar tema"
      >
        <input
          type="checkbox"
          className="theme-toggle-checkbox"
          checked={theme === 'dark'}
          onChange={handleToggle}
        />
        <svg viewBox="0 0 32 18" width={40} height={22} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="container">
              <feDropShadow dx="0" dy="2" floodOpacity="0.2" stdDeviation="2"/>
            </filter>
            <filter id="sun-outer">
              <feDropShadow dx="0" dy="1" floodOpacity="0.3" stdDeviation="1"/>
            </filter>
            <filter id="sun">
              <feDropShadow dx="0" dy="1" floodOpacity="0.2" stdDeviation="0.5"/>
            </filter>
            <filter id="moon">
              <feDropShadow dx="0" dy="1" floodOpacity="0.3" stdDeviation="1"/>
            </filter>
            <filter id="cloud">
              <feDropShadow dx="0" dy="1" floodOpacity="0.2" stdDeviation="0.5"/>
            </filter>
          </defs>
          <g transform="translate(1.5 1.5)">
            <g filter="url(#container)">
              <rect fill="#83cbd8" rx="7" height="15" width="29" id="container"></rect>
            </g>
            <g transform="translate(1 1)" id="button">
              <g id="sun">  
                <g filter="url(#sun-outer)">
                  <circle fill="#f8e664" r="7" cy="7" cx="7"></circle>
                </g>
                <g filter="url(#sun)">
                  <circle fill="rgba(246,254,247,0.29)" r="5" cy="7" cx="7"></circle>
                </g>
                <circle fill="#fcf4b9" r="3" cy="7" cx="7"></circle>
              </g>
              <g id="moon">
                <g filter="url(#moon)">
                  <circle fill="#cce6ee" r="7" cy="7" cx="10"></circle>
                </g>
                <g fill="#a6cad0" id="patches">
                  <circle r="1" cy="9" cx="23"></circle>
                  <circle r="1" cy="13" cx="19"></circle>
                </g>
              </g>
            </g>
            <g filter="url(#cloud)">
              <ellipse fill="#fff" cx="23" cy="13" rx="4" ry="2" id="cloud"></ellipse>
            </g>
            <g fill="#def8ff" id="stars">
              <circle r="0.5" cx="25" cy="3"></circle>
              <circle r="0.5" cx="27" cy="6"></circle>
              <circle r="0.5" cx="21" cy="5"></circle>
            </g>
          </g>
        </svg>
      </label>
      <span className="sr-only">Cambiar tema</span>
    </div>
  );
}
