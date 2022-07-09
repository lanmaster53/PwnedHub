!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).VueSocketIOExt={})}(this,(function(e){"use strict";function t(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function n(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function r(e){for(var r=1;r<arguments.length;r++){var o=null!=arguments[r]?arguments[r]:{};r%2?n(Object(o),!0).forEach((function(n){t(e,n,o[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(o)):n(Object(o)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(o,t))}))}return e}function o(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}function c(e){return function(e){if(Array.isArray(e))return e}(e)||a(e)||u(e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function i(e){return function(e){if(Array.isArray(e))return s(e)}(e)||a(e)||u(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function a(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}function u(e,t){if(e){if("string"==typeof e)return s(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?s(e,t):void 0}}function s(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var f,l,p=function(e){return"function"==typeof e},b=function(e){return e&&e.length<=1?e[0]:e},d=function(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return function(e){return t.reduce((function(e,t){return t(e)}),e)}},y=function(e){return function(t){return e+t}},h=function(e,t,n){var r=e[t];e[t]=function(){for(var t=arguments.length,o=new Array(t),c=0;c<t;c++)o[c]=arguments[c];r.call.apply(r,[e].concat(o)),n.apply(void 0,o)}},v={emit:function(e){for(var t=arguments.length,n=new Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];var o=l.get(e)||[];o.forEach((function(e){var t;(t=e.callback).call.apply(t,[e.vm].concat(n))}))},addListener:function(e,t,n){p(n)&&(l.has(t)||l.set(t,[]),l.get(t).push({callback:n,vm:e}))},removeListenersByLabel:function(e,t){var n=(l.get(t)||[]).filter((function(t){return t.vm!==e}));n.length>0?l.set(t,n):l.delete(t)},_listeners:l=new Map(f)},m=function(e){return Object.keys(e._mutations)},g=function(e){return Object.keys(e._actions)},O=function(e){return e.split("/").pop()},w=function(e,t){if("string"!=typeof e&&!Array.isArray(e))throw new TypeError("Expected the input to be `string | string[]`");t=Object.assign({pascalCase:!1},t);var n;return 0===(e=Array.isArray(e)?e.map((function(e){return e.trim()})).filter((function(e){return e.length})).join("-"):e.trim()).length?"":1===e.length?t.pascalCase?e.toUpperCase():e.toLowerCase():(e!==e.toLowerCase()&&(e=function(e){for(var t=!1,n=!1,r=!1,o=0;o<e.length;o++){var c=e[o];t&&/[a-zA-Z]/.test(c)&&c.toUpperCase()===c?(e=e.slice(0,o)+"-"+e.slice(o),t=!1,r=n,n=!0,o++):n&&r&&/[a-zA-Z]/.test(c)&&c.toLowerCase()===c?(e=e.slice(0,o-1)+"-"+e.slice(o-1),r=n,n=!1,t=!0):(t=c.toLowerCase()===c&&c.toUpperCase()!==c,r=n,n=c.toUpperCase()===c&&c.toLowerCase()!==c)}return e}(e)),e=e.replace(/^[_.\- ]+/,"").toLowerCase().replace(/[_.\- ]+(\w|$)/g,(function(e,t){return t.toUpperCase()})).replace(/\d+(\w|$)/g,(function(e){return e.toUpperCase()})),n=e,t.pascalCase?n.charAt(0).toUpperCase()+n.slice(1):n)},j=w,k=w;j.default=k;var _=Object.freeze({actionPrefix:"socket_",mutationPrefix:"SOCKET_",eventToMutationTransformer:function(e){return e.toUpperCase()},eventToActionTransformer:j}),A=["connect","error","disconnect","reconnect","reconnect_attempt","reconnecting","reconnect_error","reconnect_failed","connect_error","connect_timeout","connecting","ping","pong"];e.Socket=function(e){return t=function(t,n){!function(e,t,n){e.methods&&Object.prototype.hasOwnProperty.call(e.methods,n)&&(e.sockets=e.sockets||{},e.sockets[t]=e.methods[n])}(t,e&&"string"==typeof e?e:n,n)},function(e,n,r){var o="function"==typeof e?e:e.constructor;o.__decorators__||(o.__decorators__=[]),"number"!=typeof r&&(r=void 0),o.__decorators__.push((function(e){return t(e,n,r)}))};var t},e.defaults=_,e.install=function(e,t,n){if(!((a=t)&&p(a.on)&&p(a.emit)))throw new Error("[vue-socket.io-ext] you have to pass `socket.io-client` instance to the plugin");var a,u={};!function(e,t,n){var r=new e({data:function(){return{connected:!1}},computed:{disconnected:function(){return!this.connected}}});t.on("connect",(function(){r.connected=!0})),t.on("disconnect",(function(){r.connected=!1})),Object.defineProperties(n,{connected:{get:function(){return r.connected},enumerable:!1},disconnected:{get:function(){return r.disconnected},enumerable:!1}})}(e,t,u),function(e,t){Object.defineProperties(t,{client:{value:e,writable:!1,enumerable:!1}})}(t,u),e.prototype.$socket=u,function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.store,a=o(t,["store"]),u=r(r({},_),a),s=d(u.eventToActionTransformer,y(u.actionPrefix)),f=d(u.eventToMutationTransformer,y(u.mutationPrefix));function l(e,t){if(n){var r=f(e),o=s(e),c=m(n),i=g(n),a=b(t);c.filter((function(e){return O(e)===r})).forEach((function(e){return n.commit(e,a)})),i.filter((function(e){return O(e)===o})).forEach((function(e){return n.dispatch(e,a)}))}}function p(){h(e,"onevent",(function(e){var t=c(e.data),n=t[0],r=t.slice(1),o=n;a.eventMapping&&(o=a.eventMapping(n,r)),v.emit.apply(v,[o].concat(i(r))),l(o,r)})),A.forEach((function(t){e.on(t,(function(){for(var e=arguments.length,n=new Array(e),r=0;r<e;r++)n[r]=arguments[r];v.emit.apply(v,[t].concat(n)),l(t,n)}))}))}p()}(t,n),e.mixin(function(e){return{created:function(){this.$options.sockets=this.$options.sockets||{};var t=this.$options.sockets,n=e.addListener.bind(null,this),r=e.removeListenersByLabel.bind(null,this);Object.keys(t).forEach((function(e){n(e,t[e])})),this.$socket=this.$socket||{},Object.defineProperties(this.$socket,{$subscribe:{value:n,writable:!1,enumerable:!1,configurable:!0},$unsubscribe:{value:r,writable:!1,enumerable:!1,configurable:!0}})},beforeDestroy:function(){var t=this,n=this.$options.sockets,r=void 0===n?{}:n;Object.keys(r).forEach((function(n){e.removeListenersByLabel(t,n)}))},destroyed:function(){delete this.$socket.$subscribe,delete this.$socket.$unsubscribe}}}(v));var s=e.config.optionMergeStrategies;s.sockets=s.methods},Object.defineProperty(e,"__esModule",{value:!0})}));
