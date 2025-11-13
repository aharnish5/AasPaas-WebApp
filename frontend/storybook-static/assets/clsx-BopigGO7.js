import{r as s}from"./index-CleY8y_P.js";/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var d={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=r=>r.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),y=(r,o)=>{const e=s.forwardRef(({color:t="currentColor",size:a=24,strokeWidth:i=2,absoluteStrokeWidth:c,className:l="",children:n,...f},m)=>s.createElement("svg",{ref:m,...d,width:a,height:a,stroke:t,strokeWidth:c?Number(i)*24/Number(a):i,className:["lucide",`lucide-${w(r)}`,l].join(" "),...f},[...o.map(([p,g])=>s.createElement(p,g)),...Array.isArray(n)?n:[n]]));return e.displayName=`${r}`,e};function u(r){var o,e,t="";if(typeof r=="string"||typeof r=="number")t+=r;else if(typeof r=="object")if(Array.isArray(r)){var a=r.length;for(o=0;o<a;o++)r[o]&&(e=u(r[o]))&&(t&&(t+=" "),t+=e)}else for(e in r)r[e]&&(t&&(t+=" "),t+=e);return t}function b(){for(var r,o,e=0,t="",a=arguments.length;e<a;e++)(r=arguments[e])&&(o=u(r))&&(t&&(t+=" "),t+=o);return t}export{b as a,y as c};
