import React,{createContext,useContext,useLayoutEffect,useEffect,useState} from 'react';
const Context=createContext(null);
const validTheme=value=>value==='galaxy'?'galaxy':'dark';
export function ThemeProvider({children}) {
  const [theme,setTheme]=useState(()=>{try{return validTheme(localStorage.getItem('vovinam-night-theme'));}catch{return 'dark';}});
  useLayoutEffect(()=>{
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='galaxy'?'#080b1c':'#091727');
    try{localStorage.setItem('vovinam-night-theme',theme);}catch{}
  },[theme]);
  useEffect(()=>{const sync=e=>{if(e.key==='vovinam-night-theme')setTheme(validTheme(e.newValue));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  return <Context.Provider value={{theme,toggle:()=>setTheme(v=>v==='dark'?'galaxy':'dark')}}>{children}</Context.Provider>;
}
export const useTheme=()=>useContext(Context);
