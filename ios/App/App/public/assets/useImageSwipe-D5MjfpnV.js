import{c as e}from"./index-DXJv48IP.js";import{r as t}from"./vendor-Ce2S7JN_.js";
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=e("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]),r=e("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]),s=({images:e,onImageChange:n})=>{const[r,s]=t.useState(0),o=t.useRef(null),a=t.useRef(0),c=t.useRef(0),u=()=>{const t=r<e.length-1?r+1:0;s(t),n?.(t)},h=()=>{const t=r>0?r-1:e.length-1;s(t),n?.(t)};return t.useEffect(()=>{const e=o.current;if(!e)return;const t=e=>{a.current=e.touches[0].clientX},n=e=>{e.preventDefault()},r=e=>{c.current=e.changedTouches[0].clientX,s()},s=()=>{const e=a.current-c.current;Math.abs(e)>50&&(e>0?u():h())};return e.addEventListener("touchstart",t,{passive:!1}),e.addEventListener("touchmove",n,{passive:!1}),e.addEventListener("touchend",r,{passive:!1}),()=>{e.removeEventListener("touchstart",t),e.removeEventListener("touchmove",n),e.removeEventListener("touchend",r)}},[r,e.length]),{currentIndex:r,containerRef:o,goToNext:u,goToPrevious:h,goToIndex:t=>{t>=0&&t<e.length&&(s(t),n?.(t))},currentImage:e[r],hasNext:r<e.length-1,hasPrevious:r>0}};
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */export{n as C,r as a,s as u};
