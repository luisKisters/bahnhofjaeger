if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,c)=>{const a=e||("document"in self?document.currentScript.src:"")||location.href;if(s[a])return;let t={};const r=e=>n(e,a),o={module:{uri:a},exports:t,require:r};s[a]=Promise.all(i.map((e=>o[e]||r(e)))).then((e=>(c(...e),t)))}}define(["./workbox-e9849328"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/Stationspreisliste_2025_extracted.csv",revision:"fb991c60b44f61c2485e573c6ef8de38"},{url:"/_next/app-build-manifest.json",revision:"d9774e02b87ac942458931a913f43e59"},{url:"/_next/static/VrcUQGjrJqDEfDqC5kmXd/_buildManifest.js",revision:"0a307b9e0120188f9dd33ef7d38aec44"},{url:"/_next/static/VrcUQGjrJqDEfDqC5kmXd/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/192-470fe9b49196b9cd.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/219-ae5431edce8dad11.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/4-58a6a409a72cb41b.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/550-3b182800a9c6d0ae.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/app/_not-found/page-2aebbae6d00a4c64.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/app/collection/page-715564667a066e36.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/app/layout-715ce831a5eb21d6.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/app/page-8d43ae0dca0d72de.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/app/search/page-a35fae12c5a9f5a1.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/ba6fca0d-809413009bbcf675.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/framework-b4cd889405a2ce64.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/main-app-845ce7ee1ee85b5c.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/main-e08139e98de59c34.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/pages/_app-a0162e1702e1c9c5.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/pages/_error-fcf789c2237f2de3.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-26315814ab64e90c.js",revision:"VrcUQGjrJqDEfDqC5kmXd"},{url:"/_next/static/css/69f5643ee6759403.css",revision:"69f5643ee6759403"},{url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},{url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},{url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},{url:"/_next/static/media/6d93bde91c0c2823-s.woff2",revision:"621a07228c8ccbfd647918f1021b4868"},{url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},{url:"/_next/static/media/a34f9d1faa5f3315-s.p.woff2",revision:"d4fe31e6a2aebc06b8d6e558c9141119"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/data/Stationspreisliste_2025_extracted.csv",revision:"fb991c60b44f61c2485e573c6ef8de38"},{url:"/favicon.ico",revision:"03ee90efc235262dd2130f45bea649e1"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icons/icon-144x144.png",revision:"028042ed0c11cf1894d5557672c666b5"},{url:"/icons/icon-16x16.png",revision:"d266a3d1985db71517ded96937cb3ea4"},{url:"/icons/icon-192x192.png",revision:"63654d816cbe758392355fb107d08200"},{url:"/icons/icon-256x256.png",revision:"334754fdec1af4598291b254c21484e4"},{url:"/icons/icon-32x32.png",revision:"03ee90efc235262dd2130f45bea649e1"},{url:"/icons/icon-512x512.png",revision:"bd04f1168f48ffa61b3a4dc73b23a030"},{url:"/icons/icon-64x64.png",revision:"18888f63ce3232d16472e706413e1208"},{url:"/icons/train-icon.svg",revision:"7d0bef1fa663390b88471361df66271b"},{url:"/manifest.json",revision:"da6396dc360f4d4b1374df88258d5d9f"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/pwa.js",revision:"d74d033191a4747cccb9696e3880b63c"},{url:"/screenshot-wide.jpg",revision:"da8be976162ac4b6564fde231a1f3825"},{url:"/screenshot-wide.png",revision:"eaf8b02614d70918f76ef788d6fe2625"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
