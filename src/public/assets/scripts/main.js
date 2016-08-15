angular.module("dias.annotations",["dias.api","dias.ui"]),angular.module("dias.annotations").config(["$compileProvider",function(t){"use strict";t.debugInfoEnabled(!1)}]),angular.module("dias.annotations").controller("AnnotationFilterController",["$scope","annotations","AnnotationFilters",function(t,e,n){"use strict";var o=function(){t.selected.input=null,e.hasActiveFilters()&&(e.clearActiveFilters(),e.refreshFiltering())};t.available={filters:[{name:"label",typeahead:e.getAvailableLabels,create:n.label},{name:"user",typeahead:function(){var t=e.getAvailableUsers();return t.map(function(t){return t=angular.copy(t),t.name=t.firstname+" "+t.lastname,t})},create:n.user},{name:"shape",typeahead:e.getAvailableShapes,create:n.shape}]},t.selected={filter:t.available.filters[0],input:null},t.getTypeaheadItems=function(){return t.selected.filter.typeahead()},t.selectFilter=function(n){e.setFilter(t.selected.filter.create(n.id)),e.refreshFiltering()},t.$on("$destroy",o)}]),angular.module("dias.annotations").controller("AnnotationsController",["$scope","$element","annotations","mapAnnotations","$timeout",function(t,e,n,o,a){"use strict";var i=e[0],r=[],l=function(){if(0!==r.length){for(var t,e=i.scrollTop,n=i.offsetHeight,o=1/0,a=0,l=r.length-1;l>=0;l--)t=r[l],o=Math.min(t.offsetTop,o),a=Math.max(t.offsetTop+t.offsetHeight,a);e>o?i.scrollTop=o:e+n<a&&(n>=a-o?i.scrollTop=a-i.offsetHeight:i.scrollTop=o)}};t.shouldBeVisible=function(t){r.indexOf(t[0])===-1&&r.push(t[0])},t.shouldNotBeVisible=function(t){var e=r.indexOf(t[0]);e!==-1&&r.splice(e,1)},t.keepElementPosition=function(t){var e=t[0].offsetTop-i.scrollTop;a(function(){var n=t[0].offsetTop-i.scrollTop;i.scrollTop+=n-e})},t.getAnnotations=n.getGroupedByLabel,o.onSelectedAnnotation(l)}]),angular.module("dias.annotations").controller("AnnotatorController",["$scope","images","urlParams","msg","IMAGE_ID","keyboard","viewport","annotations","mapImage","mapAnnotations",function(t,e,n,o,a,i,r,l,s,c){"use strict";var u=document.querySelector(".navbar-annotations-filename");t.imageLoading=!0;var f=function(t){return u.innerHTML=t._filename,t},d=function(e){return t.imageLoading=!1,s.renderImage(e),l.show(e._id),t.$broadcast("image.shown",e),e},h=function(t){return n.setSlug(t._id),t},g=function(){t.imageLoading=!0},p=function(t){return g(),e.show(t).then(d).catch(o.responseError)};t.nextImage=function(){return g(),e.next().then(f).then(d).then(h).catch(o.responseError)},t.prevImage=function(){return g(),e.prev().then(f).then(d).then(h).catch(o.responseError)},t.$on("image.fetching",function(t,e){l.load(e._id)}),t.$on("canvas.moveend",function(t,e){r.set(e)}),i.on(37,function(){t.prevImage(),t.$apply()}),i.on(39,function(){t.nextImage(),t.$apply()}),i.on(32,function(){t.nextImage(),t.$apply()}),e.init(),p(parseInt(a)).then(h),n.get("annotation")&&c.jumpToAnnotation({id:parseInt(n.get("annotation"))})}]),angular.module("dias.annotations").controller("CanvasController",["$scope","mapAnnotations","map","$timeout","debounce",function(t,e,n,o,a){"use strict";var i=n.getView();n.on("moveend",function(e){var n=function(){t.$emit("canvas.moveend",{center:i.getCenter(),zoom:i.getZoom()})};a(n,100,"annotator.canvas.moveend")}),n.on("change:view",function(){i=n.getView()}),e.init(t);var r=function(){o(function(){n.updateSize()},50,!1)};t.$on("sidebar.foldout.open",r),t.$on("sidebar.foldout.close",r)}]),angular.module("dias.annotations").controller("CategoriesController",["$scope","labels","keyboard",function(t,e,n){"use strict";var o=9,a="dias.annotations.label-favourites",i=function(){var e=t.favourites.map(function(t){return t.id});window.localStorage[a]=JSON.stringify(e)},r=function(){if(window.localStorage[a]){var e=JSON.parse(window.localStorage[a]);t.favourites=t.categories.filter(function(t){return e.indexOf(t.id)!==-1})}},l=function(e){e>=0&&e<t.favourites.length&&t.selectItem(t.favourites[e])};t.hotkeysMap=["𝟭","𝟮","𝟯","𝟰","𝟱","𝟲","𝟳","𝟴","𝟵"],t.categories=[],t.favourites=[],t.categories=e.getList(),t.categoriesTree=e.getTree(),r(),t.selectItem=function(n){e.setSelected(n),t.searchCategory="",t.$broadcast("categories.selected")},t.isFavourite=function(e){return t.favourites.indexOf(e)!==-1},t.toggleFavourite=function(e,n){e.stopPropagation();var a=t.favourites.indexOf(n);a===-1&&t.favourites.length<o?t.favourites.push(n):t.favourites.splice(a,1),i()},t.favouritesLeft=function(){return t.favourites.length<o},n.on("1",function(){l(0),t.$apply()}),n.on("2",function(){l(1),t.$apply()}),n.on("3",function(){l(2),t.$apply()}),n.on("4",function(){l(3),t.$apply()}),n.on("5",function(){l(4),t.$apply()}),n.on("6",function(){l(5),t.$apply()}),n.on("7",function(){l(6),t.$apply()}),n.on("8",function(){l(7),t.$apply()}),n.on("9",function(){l(8),t.$apply()})}]),angular.module("dias.annotations").controller("ConfidenceController",["$scope","labels",function(t,e){"use strict";t.confidence=1,t.$watch("confidence",function(n){e.setCurrentConfidence(parseFloat(n)),n<=.25?t.confidenceClass="label-danger":n<=.5?t.confidenceClass="label-warning":n<=.75?t.confidenceClass="label-success":t.confidenceClass="label-primary"})}]),angular.module("dias.annotations").controller("DrawingControlsController",["$scope","mapAnnotations","labels","msg","$attrs","keyboard","mapInteractions",function(t,e,n,o,a,i,r){"use strict";var l;t.selectShape=function(i){if(null===i||t.isSelected(i))e.finishDrawing(),l=void 0;else{if(!n.hasSelected())return t.$emit("sidebar.foldout.do-open","categories"),void o.info(a.selectCategory);e.startDrawing(i),l=i}},t.isSelected=function(t){return r.active("draw")&&l===t},i.on(27,function(){t.selectShape(null),t.$apply()}),i.on("a",function(){t.selectShape("Point"),t.$apply()}),i.on("s",function(){t.selectShape("Rectangle"),t.$apply()}),i.on("d",function(){t.selectShape("Circle"),t.$apply()}),i.on("f",function(){t.selectShape("LineString"),t.$apply()}),i.on("g",function(){t.selectShape("Polygon"),t.$apply()})}]),angular.module("dias.annotations").controller("EditControlsController",["$scope","mapAnnotations","keyboard","$timeout","labels","msg","mapInteractions",function(t,e,n,o,a,i,r){"use strict";var l,s=!1,c=1e4;t.deleteSelectedAnnotations=function(){e.hasSelectedFeatures()&&confirm("Are you sure you want to delete all selected annotations?")&&e.deleteSelected()},t.hasSelectedAnnotations=e.hasSelectedFeatures;var u=function(){r.activate("translate")},f=function(){r.deactivate("translate")},d=function(){r.activate("attachLabel")},h=function(){r.deactivate("attachLabel")};t.toggleMoving=function(e){t.isMoving()?f():(e&&e.target&&e.target.blur(),u())},t.toggleAttaching=function(){t.isAttaching()?h():a.hasSelected()?d():(t.$emit("sidebar.foldout.do-open","categories"),i.info("Please select a label to attach to the annotations."))},t.canDeleteLastAnnotation=function(){return s&&e.hasDrawnAnnotation()},t.deleteLastDrawnAnnotation=function(){e.deleteLastDrawnAnnotation()},t.isMoving=function(){return r.active("translate")},t.isAttaching=function(){return r.active("attachLabel")},t.$on("annotations.drawn",function(t,e){s=!0,o.cancel(l),l=o(function(){s=!1},c)}),n.on(46,function(e){t.deleteSelectedAnnotations(),t.$apply()}),n.on(27,function(){t.isMoving()&&t.$apply(f)}),n.on(8,function(e){t.canDeleteLastAnnotation()&&(e.preventDefault(),t.deleteLastDrawnAnnotation(),t.$apply())}),n.on("m",function(){t.$apply(t.toggleMoving)}),n.on("l",function(){t.$apply(t.toggleAttaching)})}]),angular.module("dias.annotations").controller("FiltersControlController",["$scope","mapImage",function(t,e){"use strict";t.supportsFilters=e.supportsFilters}]),angular.module("dias.annotations").controller("FiltersController",["$scope","debounce","mapImage",function(t,e,n){"use strict";var o="dias.annotations.filter",a=!1,i={brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]};t.filters={brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]};var r=function(){n.filter(t.filters)};t.reset=function(e,n){void 0===e?(t.filters=angular.copy(i),r()):i.hasOwnProperty(e)&&(t.filters[e][n]=i[e][n],r())},t.toggleBrightnessRGB=function(){a?t.filters.brightnessRGB=angular.copy(i.brightnessRGB):t.filters.brightnessContrast[0]=i.brightnessContrast[0],a=!a,r()},t.isBrightnessRgbActive=function(){return a},t.$watch("filters",function(t){e(r,100,o)},!0)}]),angular.module("dias.annotations").controller("MinimapController",["$scope","map","mapImage","$element","styles",function(t,e,n,o,a){"use strict";var i=o[0],r=new ol.source.Vector,l=new ol.Map({target:i,controls:[],interactions:[]}),s=e.getSize(),c=e.getView();l.addLayer(n.getLayer()),l.addLayer(new ol.layer.Vector({source:r,style:a.viewport}));var u=new ol.Feature;r.addFeature(u),t.$on("image.shown",function(){var t=n.getExtent();l.setView(new ol.View({projection:n.getProjection(),center:ol.extent.getCenter(t),resolution:Math.max(t[2]/i.clientWidth,t[3]/i.clientHeight)}))});var f=function(){u.setGeometry(ol.geom.Polygon.fromExtent(c.calculateExtent(s)))};e.on("change:size",function(){s=e.getSize()}),e.on("change:view",function(){c=e.getView()}),e.on("postcompose",f);var d=function(t){c.setCenter(t.coordinate)};l.on("pointerdrag",d),o.on("mouseleave",function(){l.un("pointerdrag",d)}),o.on("mouseenter",function(){l.on("pointerdrag",d)})}]),angular.module("dias.annotations").controller("ScreenshotController",["$scope","map","images",function(t,e,n){"use strict";var o=function(){if(n.currentImage){var t=n.currentImage._filename.split(".");return t.length>1&&(t[t.length-1]="png"),t=t.join(".").toLowerCase(),"dias_screenshot_"+t}return"dias_screenshot.png"},a=function(t){var e,n,o,a=t.getContext("2d"),i=document.createElement("canvas").getContext("2d"),r=a.getImageData(0,0,t.width,t.height),l=r.data.length,s={top:null,left:null,right:null,bottom:null};for(e=0;e<l;e+=4)0!==r.data[e+3]&&(n=e/4%t.width,o=~~(e/4/t.width),null===s.top&&(s.top=o),null===s.left?s.left=n:n<s.left&&(s.left=n),null===s.right?s.right=n:s.right<n&&(s.right=n),null===s.bottom?s.bottom=o:s.bottom<o&&(s.bottom=o));var c=s.bottom-s.top,u=s.right-s.left,f=a.getImageData(s.left,s.top,u,c);return i.canvas.width=u,i.canvas.height=c,i.putImageData(f,0,0),i.canvas},i=function(t,e){var n="image/png";if(HTMLCanvasElement.prototype.toBlob)t.toBlob(e,n);else{for(var o=atob(t.toDataURL(n).split(",")[1]),a=o.length,i=new Uint8Array(a),r=0;r<a;r++)i[r]=o.charCodeAt(r);e(new Blob([i],{type:n}))}},r=function(t){var e=document.createElement("a");e.style="display: none",e.download=o(),e.href=URL.createObjectURL(t),document.body.appendChild(e),e.click(),setTimeout(function(){document.body.removeChild(e),URL.revokeObjectURL(e.href)},100)};t.makeShot=function(){e.once("postcompose",function(t){i(a(t.context.canvas),r)}),e.renderSync()}}]),angular.module("dias.annotations").controller("SelectedLabelController",["$scope","labels",function(t,e){"use strict";t.getSelectedLabel=e.getSelected,t.hasSelectedLabel=e.hasSelected}]),angular.module("dias.annotations").controller("SettingsAnnotationOpacityController",["$scope","mapAnnotations",function(t,e){"use strict";t.setDefaultSettings("annotation_opacity","1"),t.$watch("settings.annotation_opacity",function(t){e.setOpacity(t)})}]),angular.module("dias.annotations").controller("SettingsAnnotationsCyclingController",["$scope","mapAnnotations","annotations","labels","keyboard",function(t,e,n,o,a){"use strict";var i=!1,r="annotations",l=function(n){if(!i&&t.cycling())return e.hasNext()?e.cycleNext():(t.nextImage().then(e.jumpToFirst),i=!0),n&&t.$apply(),!1},s=function(n){if(!i&&t.cycling())return e.hasPrevious()?e.cyclePrevious():(t.prevImage().then(e.jumpToLast),i=!0),n&&t.$apply(),!1},c=function(a){i||(a&&a.preventDefault(),t.cycling()&&o.hasSelected()?n.attachAnnotationLabel(e.getCurrent()).$promise.then(function(){e.flicker(1)}):e.flicker())},u=function(e){return e.preventDefault(),t.stopCycling(),t.$apply(),!1};t.attributes={restrict:!1},t.cycling=function(){return t.getVolatileSettings("cycle")===r},t.startCycling=function(){t.setVolatileSettings("cycle",r)},t.stopCycling=function(){t.setVolatileSettings("cycle","")},t.$watch("volatileSettings.cycle",function(t,o){t===r?(a.on(37,s,10),a.on(39,l,10),a.on(32,l,10),a.on(13,c,10),a.on(27,u,10),e.jumpToCurrent(),n.observeFilter(e.jumpToFirst)):o===r&&(a.off(37,s),a.off(39,l),a.off(32,l),a.off(13,c),a.off(27,u),e.clearSelection(),n.unobserveFilter(e.jumpToFirst))}),t.$on("image.shown",function(){i=!1}),t.prevAnnotation=s,t.nextAnnotation=l,t.attachLabel=c}]),angular.module("dias.annotations").controller("SettingsController",["$scope","debounce",function(t,e){"use strict";var n="dias.annotations.settings",o={};t.settings={},t.volatileSettings={};var a=function(){var e=angular.copy(t.settings);for(var a in e)e[a]===o[a]&&delete e[a];window.localStorage[n]=JSON.stringify(e)},i=function(){e(a,250,n)},r=function(){var t={};return window.localStorage[n]&&(t=JSON.parse(window.localStorage[n])),angular.extend(t,o)};t.setSettings=function(e,n){t.settings[e]=n},t.getSettings=function(e){return t.settings[e]},t.setDefaultSettings=function(e,n){o[e]=n,t.settings.hasOwnProperty(e)||t.setSettings(e,n)},t.setVolatileSettings=function(e,n){t.volatileSettings[e]=n},t.getVolatileSettings=function(e){return t.volatileSettings[e]},t.$watch("settings",i,!0),angular.extend(t.settings,r())}]),angular.module("dias.annotations").controller("SettingsSectionCyclingController",["$scope","map","mapImage","keyboard",function(t,e,n,o){"use strict";var a,i=!1,r="sections",l=[0,0],s=[0,0],c=[0,0],u=[0,0],f=function(t,e){return Math.sqrt(Math.pow(t[0]-e[0],2)+Math.pow(t[1]-e[1],2))},d=function(t){for(var e=1/0,n=0,o=[0,0],a=0;a<=c[1];a++)for(var i=0;i<=c[0];i++)n=f(t,y([i,a])),n<e&&(o[0]=i,o[1]=a,e=n);return o},h=function(){a=e.getView(),a.on("change:resolution",g);var t=n.getExtent(),o=a.calculateExtent(e.getSize());s[0]=o[2]-o[0],s[1]=o[3]-o[1],l[0]=s[0]/2,l[1]=s[1]/2,c[0]=Math.ceil(t[2]/s[0])-1,c[1]=Math.ceil(t[3]/s[1])-1;var i;c[0]>0?(i=s[0]*(c[0]+1)-t[2],s[0]-=i/c[0]):(s[0]=o[2],l[0]=t[2]/2),c[1]>0?(i=s[1]*(c[1]+1)-t[3],s[1]-=i/c[1]):(s[1]=o[3],l[1]=t[3]/2)},g=function(){h();var t=d(y(u));u[0]=t[0],u[1]=t[1]},p=function(){h(),b(d(a.getCenter()))},m=function(){b([0,0])},v=function(){b(c)},y=function(t){return[t[0]*s[0]+l[0],t[1]*s[1]+l[1]]},b=function(t){u[0]=t[0],u[1]=t[1],a.setCenter(y(u))},w=function(){return u[0]<c[0]?[u[0]+1,u[1]]:[0,u[1]+1]},S=function(){return u[0]>0?[u[0]-1,u[1]]:[c[0],u[1]-1]},C=function(e){if(!i&&t.cycling())return u[0]<c[0]||u[1]<c[1]?b(w()):(t.nextImage().then(h).then(m),i=!0),e&&t.$apply(),!1},$=function(e){if(!i&&t.cycling())return u[0]>0||u[1]>0?b(S()):(t.prevImage().then(h).then(v),i=!0),e&&t.$apply(),!1},A=function(e){return e.preventDefault(),t.stopCycling(),t.$apply(),!1};t.cycling=function(){return t.getVolatileSettings("cycle")===r},t.startCycling=function(){t.setVolatileSettings("cycle",r)},t.stopCycling=function(){t.setVolatileSettings("cycle","")},t.$watch("volatileSettings.cycle",function(t,n){t===r?(e.on("change:size",p),h(),m(),o.on(37,$,10),o.on(39,C,10),o.on(32,C,10),o.on(27,A,10)):n===r&&(e.un("change:size",p),a.un("change:resolution",g),o.off(37,$),o.off(39,C),o.off(32,C),o.off(27,A))}),t.$on("image.shown",function(){i=!1}),t.prevSection=$,t.nextSection=C}]),angular.module("dias.annotations").controller("SidebarCategoryFoldoutController",["$scope","keyboard",function(t,e){"use strict";e.on(9,function(e){e.preventDefault(),t.toggleFoldout("categories"),t.$apply()})}]),angular.module("dias.annotations").controller("SidebarController",["$scope","$rootScope",function(t,e){"use strict";var n="dias.annotations.sidebar-foldout",o=!1;t.toggleAnnotationFilter=function(){o=!o},t.isAnnotationFilterOpen=function(){return o},t.foldout="",t.openFoldout=function(o){window.localStorage[n]=o,t.foldout=o,e.$broadcast("sidebar.foldout.open",o)},t.closeFoldout=function(){window.localStorage.removeItem(n),t.foldout="",e.$broadcast("sidebar.foldout.close")},t.toggleFoldout=function(e){t.foldout===e?t.closeFoldout():t.openFoldout(e)},e.$on("sidebar.foldout.do-open",function(e,n){t.openFoldout(n)}),window.localStorage[n]&&t.openFoldout(window.localStorage[n])}]),angular.module("dias.annotations").directive("annotationListItem",["annotations","mapAnnotations","USER_ID",function(t,e,n){"use strict";return{controller:["$scope","$element",function(o,a){var i=!1,r=o.a.annotation,l=o.a.label,s=function(){return e.isAnnotationSelected(o.a.annotation)};o.getUsername=function(){return l.user?l.user.firstname+" "+l.user.lastname:"(user deleted)"},o.getClass=function(){return{selected:i}},o.getShapeClass=function(){return"icon-"+o.a.shape.toLowerCase()},o.select=function(t){e.toggleSelect(o.a.annotation,t.shiftKey),o.keepElementPosition(a)},o.zoomTo=function(){e.fit(o.a.annotation)},o.canBeRemoved=function(){return l.user&&l.user.id===n},o.remove=function(n){n.stopPropagation(),r.labels.length>1?t.removeAnnotationLabel(r,l):1===r.labels.length&&confirm("Detaching the last label will delete the annotation. Proceed?")&&e.deleteAnnotation(r)},o.$watch(s,function(t){i=t,i?o.shouldBeVisible(a):o.shouldNotBeVisible(a)}),a.on("$destroy",function(){o.shouldNotBeVisible(a)})}]}}]),angular.module("dias.annotations").directive("labelCategoryItem",["$compile","$timeout","$templateCache",function(t,e,n){"use strict";return{restrict:"C",templateUrl:"label-item.html",scope:!0,link:function(o,a,i){var r=angular.element(n.get("label-subtree.html"));e(function(){a.append(t(r)(o))})},controller:["$scope","labels",function(t,e){var n=!1,o=!1,a=!1,i=function(){e.isOpen(t.item)?(n=!0,a=!1):e.isSelected(t.item)?(n=!0,a=!0):(n=!1,a=!1)},r=function(){o=t.tree&&!!t.tree[t.item.id]};t.getSubtree=function(){return n&&t.tree?t.tree[t.item.id]:[]},t.getClass=function(){return{open:n,expandable:o,selected:a}},t.$on("categories.selected",i),i(),r()}]}}]),angular.module("dias.annotations").directive("labelItem",function(){"use strict";return{controller:["$scope",function(t){var e=t.annotationLabel.confidence;e<=.25?t.class="label-danger":e<=.5?t.class="label-warning":e<=.75?t.class="label-success":t.class="label-primary"}]}}),angular.module("dias.annotations").directive("labelsListItem",["mapAnnotations",function(t){"use strict";return{restrict:"A",controller:["$scope",function(e){var n=!1,o=function(){for(var n=e.item.annotations,o=n.length-1;o>=0;o--)if(t.isAnnotationSelected(n[o].annotation))return!0;return!1},a=function(){return n||o()};e.getClass=function(){return{selected:a()}},e.isSelected=a,e.toggleOpen=function(){n=!n}}]}}]),angular.module("dias.annotations").factory("AnnotationFilters",function(){"use strict";return{label:function(t){return function(e){var n={};e.groupedByLabel.hasOwnProperty(t)&&(n[t]=e.groupedByLabel[t]);var o=e.flat.filter(function(e){return e.labels=e.labels.filter(function(e){return e.label.id===t}),e.labels.length>0});return{groupedByLabel:n,flat:o}}},user:function(t){return function(e){var n,o=e.groupedByLabel;for(var a in o)if(o.hasOwnProperty(a)){n=o[a].annotations;for(var i=n.length-1;i>=0;i--)n[i].label.user.id!==t&&n.splice(i,1);0===n.length&&delete o[a]}var r=e.flat.filter(function(e){return e.labels=e.labels.filter(function(e){return e.user.id===t}),e.labels.length>0});return{groupedByLabel:o,flat:r}}},shape:function(t){return function(e){var n,o=e.groupedByLabel;for(var a in o)if(o.hasOwnProperty(a)){n=o[a].annotations;for(var i=n.length-1;i>=0;i--)n[i].annotation.shape_id!==t&&n.splice(i,1);0===n.length&&delete o[a]}var r=e.flat.filter(function(e){return e.shape_id===t});return{groupedByLabel:o,flat:r}}}}}),angular.module("dias.annotations").factory("AttachLabelInteraction",["annotations","labels","msg",function(t,e,n){"use strict";function o(t){ol.interaction.Pointer.call(this,{handleUpEvent:o.handleUpEvent,handleDownEvent:o.handleDownEvent,handleMoveEvent:o.handleMoveEvent}),this.features=void 0!==t.features?t.features:null,this.currentFeature=void 0}return ol.inherits(o,ol.interaction.Pointer),o.handleDownEvent=function(t){return this.currentFeature=this.featuresAtPixel(t.pixel,t.map),!!this.currentFeature},o.handleUpEvent=function(n){this.currentFeature&&this.currentFeature.annotation&&e.hasSelected()&&t.attachAnnotationLabel(this.currentFeature.annotation),this.currentFeature=void 0},o.handleMoveEvent=function(t){var e=t.map.getTargetElement(),n=this.featuresAtPixel(t.pixel,t.map);n?e.style.cursor="pointer":e.style.cursor=""},o.prototype.featuresAtPixel=function(t,e){var n=null,o=e.forEachFeatureAtPixel(t,function(t){return t},this);return this.handlesFeature(o)&&(n=o),n},o.prototype.handlesFeature=function(t){return!!this.features&&this.features.getArray().indexOf(t)!==-1},o}]),angular.module("dias.annotations").factory("ExtendedTranslateInteraction",["keyboard","map",function(t,e){"use strict";function n(t){ol.interaction.Translate.call(this,t),this.features=void 0!==t.features?t.features:null,this.on("change:active",this.toggleListeners);var e=this;this.translateUp=function(){return e.translate(0,1)},this.translateDown=function(){return e.translate(0,-1)},this.translateLeft=function(){return e.translate(-1,0)},this.translateRight=function(){return e.translate(1,0)}}return ol.inherits(n,ol.interaction.Translate),n.prototype.toggleListeners=function(n){n.oldValue?(t.off(37,this.translateLeft),t.off(38,this.translateUp),t.off(39,this.translateRight),t.off(40,this.translateDown),e.getTargetElement().style.cursor=""):(t.on(37,this.translateLeft,10),t.on(38,this.translateUp,10),t.on(39,this.translateRight,10),t.on(40,this.translateDown,10))},n.prototype.translate=function(t,e){return!(this.features&&this.features.getLength()>0)||(this.features.forEach(function(n){var o=n.getGeometry();o.translate(t,e),n.setGeometry(o)}),!1)},n}]),angular.module("dias.annotations").factory("ZoomToNativeControl",function(){"use strict";function t(t){var e=t||{},n=e.label?e.label:"1",o=document.createElement("button"),a=this;o.innerHTML=n,o.title="Zoom to original resolution",o.addEventListener("click",function(){a.zoomToNative.call(a)});var i=document.createElement("div");i.className="zoom-to-native ol-unselectable ol-control",i.appendChild(o),ol.control.Control.call(this,{element:i,target:e.target}),this.duration_=void 0!==e.duration?e.duration:250}return ol.inherits(t,ol.control.Control),t.prototype.zoomToNative=function(){var t=this.getMap(),e=t.getView();if(e){var n=e.getResolution();n&&(this.duration_>0&&t.beforeRender(ol.animation.zoom({resolution:n,duration:this.duration_,easing:ol.easing.easeOut})),e.setResolution(e.constrainResolution(1)))}},t}),angular.module("dias.annotations").factory("map",["ZoomToNativeControl",function(t){"use strict";var e=new ol.Map({target:"canvas",renderer:"canvas",controls:[new ol.control.Zoom,new ol.control.ZoomToExtent({tipLabel:"Zoom to show whole image",label:""}),new ol.control.FullScreen({label:""}),new t({label:""})],interactions:ol.interaction.defaults({keyboard:!1})});return e}]),angular.module("dias.annotations").service("annotations",["Annotation","SHAPES","msg","AnnotationLabel","labels","$q",function(t,e,n,o,a,i){"use strict";var r,l=this,s=i.defer(),c=s.promise,u=[],f=[],d={},h={groupedByLabel:{},flat:[]},g=[],p=[],m=[],v={},y=function(t,e,n){for(var o=t.length-1;o>=0;o--)if(t[o].id===e)return n(t[o],o)},b=function(t){for(var n=e.length-1;n>=0;n--)if(e[n].id===t)return e[n]},w=function(t){for(var n=e.length-1;n>=0;n--)if(e[n].name===t)return e[n]},S=function(t){return t.shape=b(t.shape_id).name,t},C=function(t){return r.push(t),A(t,t.labels[0]),t},$=function(t){var e=r.indexOf(t);return r.splice(e,1),F(t),t},A=function(t,e){var n={annotation:t,label:e,shape:t.shape},o=e.label;d.hasOwnProperty(o.id)?d[o.id].annotations.push(n):d[o.id]={label:o,annotations:[n]}},L=function(t,e){for(var n=d[e.id].annotations,o=n.length-1;o>=0;o--)if(n[o].annotation.id===t.id){n.splice(o,1);break}0===n.length&&delete d[e.id]},F=function(t){for(var e in d)d.hasOwnProperty(e)&&L(t,d[e].label)},I=function(){for(var t in d)d.hasOwnProperty(t)&&delete d[t]},x=function(t){for(var e,n,o=t.length-1;o>=0;o--){e=t[o],n=e.labels;for(var a=n.length-1;a>=0;a--)A(e,n[a])}},E=function(t){for(var e={groupedByLabel:angular.copy(d),flat:angular.copy(r)},n=g.length-1;n>=0;n--)e=g[n](e);h.groupedByLabel=e.groupedByLabel,h.flat=e.flat,t||u.forEach(function(t){t(h.flat)})},k=function(){p.length=0;for(var t in d)d.hasOwnProperty(t)&&p.push(d[t].label)},P=function(){m.length=0;var t={};r.forEach(function(e){e.labels.forEach(function(e){t.hasOwnProperty(e.user.id)||(t[e.user.id]=1,m.push(e.user))})})},T=function(t){P(),k(),E(t===!0)};this.get=function(){return h.flat},this.getGroupedByLabel=function(){return h.groupedByLabel},this.load=function(e){return v.hasOwnProperty(e)||(v[e]=t.query({id:e}),v[e].$promise.then(function(t){t.forEach(S)})),v[e]},this.show=function(t){I(),r=l.load(t),c=r.$promise.then(x).then(T).then(l.get).then(s.resolve).catch(s.reject)},this.add=function(e){!e.shape_id&&e.shape&&(e.shape_id=w(e.shape).id);var o=t.add(e);return o.$promise.catch(n.responseError).then(S).then(C).then(T),o},this.delete=function(t){return y(r,t.id,function(t){return t.$delete().catch(n.responseError).then($).then(T)})},this.save=function(t){t.$save(function(){y(r,t.id,function(e,n){r[n]=angular.copy(t)})},n.responseError)},this.getPromise=function(){return c},this.attachAnnotationLabel=function(t,e,i){e=e||a.getSelected(),i=i||a.getCurrentConfidence();var l=o.attach({annotation_id:t.id,label_id:e.id,confidence:i},function(){y(r,t.id,function(t){t.labels.push(l),A(t,l),T(!0)})},n.responseError);return l},this.removeAnnotationLabel=function(t,e){return o.delete({id:e.id},function(){y(r,t.id,function(t){y(t.labels,e.id,function(e,n){t.labels.splice(n,1)}),L(t,e.label),T()})},n.responseError)},this.setFilter=function(t){l.clearActiveFilters(),g.push(t)},this.refreshFiltering=function(){E(),f.forEach(function(t){t()})},this.clearActiveFilters=function(){g.length=0},this.hasActiveFilters=function(){return g.length>0},this.getAvailableLabels=function(){return p},this.getAvailableUsers=function(){return m},this.getAvailableShapes=function(){return e},this.observe=function(t){u.push(t)},this.observeFilter=function(t){f.push(t)},this.unobserveFilter=function(t){var e=f.indexOf(t);e!==-1&&f.splice(e,1)}}]),angular.module("dias.annotations").service("images",["$rootScope","URL","$q","filterSubset","TRANSECT_ID","IMAGES_IDS","IMAGES_FILENAMES",function(t,e,n,o,a,i,r){"use strict";var l=this,s=[],c=5,u=[];this.currentImage=void 0;var f=function(t){var e=i.indexOf(t);return r[e]},d=function(t){t=t||l.currentImage._id;var e=s.indexOf(t);return s[(e+1)%s.length]},h=function(t){t=t||l.currentImage._id;var e=s.indexOf(t),n=s.length;return s[(e-1+n)%n]},g=function(t){t=t||l.currentImage._id;for(var e=u.length-1;e>=0;e--)if(u[e]._id==t)return u[e]},p=function(t){return l.currentImage=t,t},m=function(o){var a=n.defer(),i=g(o);return i?a.resolve(i):(i=document.createElement("img"),i._id=o,i._filename=f(o),i.onload=function(){u.push(i),u.length>c&&u.shift(),a.resolve(i)},i.onerror=function(t){a.reject(t)},i.src=e+"/api/v1/images/"+o+"/file"),t.$broadcast("image.fetching",i),a.promise},v=function(t){return m(d(t._id)),m(h(t._id)),t};this.init=function(){s=i;var t=window.localStorage["dias.transects."+a+".images"];t&&(t=JSON.parse(t),o(t,s),s=t)},this.show=function(t){return m(t).then(p).then(v)},this.next=function(){return l.show(d())},this.prev=function(){return l.show(h())},this.getCurrentId=function(){return l.currentImage._id}}]),angular.module("dias.annotations").service("labels",["AnnotationLabel","LABEL_TREES",function(t,e){"use strict";var n,o=1,a=e,i={},r=[],l=[],s=function(){for(var t=null,e=function(e){var n=e.parent_id;i[t][n]?i[t][n].push(e):i[t][n]=[e]},n=a.length-1;n>=0;n--)t=a[n].name,i[t]={},a[n].labels.forEach(e),r=r.concat(a[n].labels)},c=function(t){for(var e=r.length-1;e>=0;e--)if(r[e].id===t)return r[e];return null},u=function(t){var e=t;if(l.length=0,e)for(;null!==e.parent_id;)l.unshift(e.parent_id),e=c(e.parent_id)};this.fetchForAnnotation=function(e){if(e)return e.labels||(e.labels=t.query({annotation_id:e.id})),e.labels},this.getTree=function(){return i},this.getList=function(){return r},this.setSelected=function(t){n=t,u(t)},this.getSelected=function(){return n},this.hasSelected=function(){return!!n},this.getSelectedId=function(){return n?n.id:null},this.setCurrentConfidence=function(t){o=t},this.getCurrentConfidence=function(){return o},this.isOpen=function(t){return l.indexOf(t.id)!==-1},this.isSelected=function(t){return n&&n.id===t.id},s()}]),angular.module("dias.annotations").service("mapAnnotations",["map","images","annotations","debounce","styles","$interval","labels","mapInteractions",function(t,e,n,o,a,i,r,l){"use strict";var s=new ol.Collection,c=new ol.source.Vector({features:s}),u=new ol.layer.Vector({source:c,style:a.features,zIndex:100,updateWhileAnimating:!0,updateWhileInteracting:!0});t.addLayer(u);var f=l.init("select",[u]).getFeatures();l.init("modify",s),l.deactivate("modify"),l.init("translate",f),l.deactivate("translate"),l.init("attachLabel",s),l.deactivate("attachLabel");var d,h,g=0,p={padding:[50,50,50,50],minResolution:1},m=this,v=function(e){m.clearSelection(),e&&(f.push(e),t.getView().fit(e.getGeometry(),t.getSize(),p))},y=function(t,n){return n%2===1?e.currentImage.height-t:t},b=function(t){var e;switch(t.getType()){case"Circle":e=[t.getCenter(),[t.getRadius()]];break;case"Polygon":case"Rectangle":e=t.getCoordinates()[0];break;case"Point":e=[t.getCoordinates()];break;default:e=t.getCoordinates()}return Array.prototype.concat.apply([],e).map(Math.round).map(y)},w=function(t){var e=t.target,a=function(){e.annotation.points=b(e.getGeometry()),n.save(e.annotation)};o(a,500,e.annotation.id)},S=function(t){for(var n,o=t.points,a=[],i=e.currentImage.height,r=0;r<o.length;r+=2)a.push([o[r],i-(o[r+1]||0)]);switch(t.shape){case"Point":n=new ol.geom.Point(a[0]);break;case"Rectangle":n=new ol.geom.Rectangle([a]);break;case"Polygon":n=new ol.geom.Polygon([a]);break;case"LineString":n=new ol.geom.LineString(a);break;case"Circle":n=new ol.geom.Circle(a[0],a[1][0]);break;default:return void console.error("Unknown annotation shape: "+t.shape)}var l=new ol.Feature({geometry:n});l.annotation=t,t.labels&&t.labels.length>0&&(l.color=t.labels[0].label.color),l.on("change",w),c.addFeature(l)},C=function(t){c.clear(),m.clearSelection(),d=null,t.forEach(S)};n.observe(C);var $=function(t){var o=t.feature.getGeometry(),a=r.getSelected();return t.feature.color=a.color,t.feature.annotation=n.add({id:e.getCurrentId(),shape:o.getType(),points:b(o),label_id:a.id,confidence:r.getCurrentConfidence()}),t.feature.annotation.$promise.catch(function(){c.removeFeature(t.feature)}),t.feature.on("change",w),d=t.feature,t.feature.annotation.$promise},A=function(t){t&&t.annotation&&(t===d&&(d=null),n.delete(t.annotation))},L=function(t){for(var e=s.getArray(),n=e.length-1;n>=0;n--)if(e[n].annotation.id===t.id)return e[n];return null};this.init=function(t){h=t,m.onSelectedAnnotation(function(){t.$$phase||t.$apply()})},this.startDrawing=function(t){l.init("draw",t,c),l.on("draw","drawend",$),l.on("draw","drawend",function(t){h.$broadcast("annotations.drawn",t.feature)})},this.finishDrawing=function(){l.deactivate("draw")},this.hasDrawnAnnotation=function(){return d&&d.annotation&&d.annotation.$resolved},this.deleteLastDrawnAnnotation=function(){A(d)},this.deleteSelected=function(){f.forEach(A)},this.deleteAnnotation=function(t){A(L(t))},this.toggleSelect=function(t,e){var n=L(t);n&&(f.remove(n)||(e||m.clearSelection(),f.push(n)))},this.hasSelectedFeatures=function(){return f.getLength()>0},this.onSelectedAnnotation=function(t){return l.on("select","select",t)},this.offSelectedAnnotation=function(t){return l.un("select","select",t)},this.fit=function(e){var n=L(e);if(n){var o=t.getView(),a=ol.animation.pan({source:o.getCenter()}),i=ol.animation.zoom({resolution:o.getResolution()});t.beforeRender(a,i),
o.fit(n.getGeometry(),t.getSize(),p)}},this.isAnnotationSelected=function(t){for(var e=f.getArray(),n=e.length-1;n>=0;n--)if(e[n].annotation&&e[n].annotation.id===t.id)return!0;return!1},this.clearSelection=function(){f.clear()},this.getSelectedFeatures=function(){return f},this.addFeature=function(t){return c.addFeature(t),$({feature:t})},this.setOpacity=function(t){u.setOpacity(t)},this.cycleNext=function(){g=(g+1)%s.getLength(),m.jumpToCurrent()},this.hasNext=function(){return g+1<s.getLength()},this.cyclePrevious=function(){var t=s.getLength();g=(g+t-1)%t,m.jumpToCurrent()},this.hasPrevious=function(){return g>0},this.jumpToCurrent=function(){n.getPromise().then(function(){v(s.item(g))})},this.jumpToFirst=function(){g=0,m.jumpToCurrent()},this.jumpToLast=function(){n.getPromise().then(function(t){0!==t.length&&(g=t.length-1),m.jumpToCurrent()})},this.jumpToAnnotation=function(t){n.getPromise().then(function(){for(var e=s.getArray(),n=e.length-1;n>=0;n--)if(e[n].annotation.id===t.id){v(e[n]);break}})},this.flicker=function(t){var e=f.item(0);if(e){t=t||3;var n=function(){f.getLength()>0?f.clear():f.push(e)};i(n,100,2*t)}},this.getCurrent=function(){return s.item(g).annotation}}]),angular.module("dias.annotations").service("mapImage",["map","viewport",function(t,e){"use strict";var n=[0,0,0,0],o=null,a=document.createElement("canvas"),i=a.getContext("2d"),r=!0,l=!0;try{var s=fx.canvas(),c=null,u=null}catch(t){r=!1,console.log(t)}window.onbeforeunload=function(){c&&(c.destroy(),s.width=1,s.height=1)};var f=new ol.proj.Projection({code:"dias-image",units:"pixels",extent:n}),d=new ol.layer.Image;t.addLayer(d);var h={brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]},g={brightnessContrast:[0,0],brightnessRGB:[0,0,0],hueSaturation:[0,0],vibrance:[0]},p=function(t,e){var n=s._.gl.getParameter(s._.gl.MAX_TEXTURE_SIZE);r=n>=e&&n>=t,r||console.log("Insufficient WebGL texture size. Required: "+t+"x"+e+", available: "+n+"x"+n+".")},m=function(){return!angular.equals(g,h)},v=function(e){if(o){u!==o.src&&(c?c.loadContentsOf(o):c=s.texture(o),u=o.src),s.draw(c);for(var n in g)g.hasOwnProperty(n)&&(angular.equals(g[n],h[n])||s[n].apply(s,g[n]));s.update(),i.drawImage(s,0,0),e&&t.render()}};this.renderImage=function(s){o=s,n[2]=o.width,n[3]=o.height,a.width=o.width,a.height=o.height,r&&l&&(l=!1,p(o.width,o.height)),r&&m()?v():i.drawImage(o,0,0),d.setSource(new ol.source.Canvas({canvas:a,projection:f,canvasExtent:n,canvasSize:[a.width,a.height]}));var c=e.getCenter();void 0!==c[0]&&void 0!==c[1]||(c=ol.extent.getCenter(n));var u=e.getZoom();t.setView(new ol.View({projection:f,center:c,zoom:u,zoomFactor:1.5,minResolution:.25,extent:n})),void 0===u&&t.getView().fit(n,t.getSize()),t.renderSync()},this.getExtent=function(){return n},this.getProjection=function(){return f},this.getLayer=function(){return d},this.filter=function(t){if(r){for(var e in g)t.hasOwnProperty(e)&&g.hasOwnProperty(e)&&(g[e]=t[e].map(parseFloat));v(!0)}},this.supportsFilters=function(){return r}}]),angular.module("dias.annotations").service("mapInteractions",["map","styles","AttachLabelInteraction","ExtendedTranslateInteraction",function(t,e,n,o){"use strict";var a=this,i={},r={select:function(t,n){return i.select=new ol.interaction.Select({style:e.highlight,layers:n,multi:!0}),i.select},modify:function(t,e){return i.modify=new ol.interaction.Modify({features:e,deleteCondition:function(t){return ol.events.condition.shiftKeyOnly(t)&&ol.events.condition.singleClick(t)}}),i.modify},draw:function(t,n,o){return i.draw=new ol.interaction.Draw({source:o,type:n,style:e.editing}),i.draw},translate:function(t,e){return i.translate=new o({features:e}),i.translate},attachLabel:function(t,e){return i.attachLabel=new n({features:e}),i.attachLabel}},l={select:function(t){t.target.getFeatures().clear()},draw:function(t){t.oldValue?(g("draw"),f("modify"),u("select")):(h("draw"),f("select"),f("translate"),f("attachLabel"),u("modify"))},translate:function(t){t.oldValue||(f("draw"),f("attachLabel"))},attachLabel:function(t){t.oldValue||(f("draw"),f("translate"))}},s=function(t){return i.hasOwnProperty(t)},c=function(t){return i[t]},u=function(t){s(t)&&i[t].setActive(!0)},f=function(t){s(t)&&i[t].setActive(!1)},d=function(t){return s(t)&&i[t].getActive()},h=function(e){s(e)&&t.addInteraction(i[e])},g=function(e){s(e)&&t.removeInteraction(i[e])},p=function(t,e,n){s(t)&&i[t].on(e,n)},m=function(t,e,n){s(t)&&i[t].on(e,n)},v=function(t){f(t),g(t);var e=r[t].apply(a,arguments);return h(t),l.hasOwnProperty(t)&&(p(t,"change:active",l[t]),l[t]({key:"active",target:e})),e};this.get=c,this.activate=u,this.deactivate=f,this.active=d,this.add=h,this.remove=g,this.on=p,this.un=m,this.init=v}]),angular.module("dias.annotations").service("styles",function(){"use strict";var t=this;this.colors={white:[255,255,255,1],blue:[0,153,255,1],orange:"#ff5e00"};var e=6,n=3,o=new ol.style.Stroke({color:this.colors.white,width:5}),a=new ol.style.Stroke({color:this.colors.white,width:6}),i=new ol.style.Stroke({color:this.colors.blue,width:n}),r=new ol.style.Stroke({color:this.colors.orange,width:n}),l=new ol.style.Fill({color:this.colors.blue}),s=new ol.style.Fill({color:this.colors.orange}),c=new ol.style.Stroke({color:this.colors.white,width:2}),u=new ol.style.Stroke({color:this.colors.white,width:n}),f=new ol.style.Stroke({color:this.colors.white,width:2,lineDash:[3]}),d=new ol.style.Stroke({color:this.colors.blue,width:n,lineDash:[5]});new ol.style.Fill({color:this.colors.blue}),new ol.style.Fill({color:this.colors.orange});this.features=function(n){var a=n.color?"#"+n.color:t.colors.blue;return[new ol.style.Style({stroke:o,image:new ol.style.Circle({radius:e,fill:new ol.style.Fill({color:a}),stroke:c})}),new ol.style.Style({stroke:new ol.style.Stroke({color:a,width:3})})]},this.highlight=[new ol.style.Style({stroke:a,image:new ol.style.Circle({radius:e,fill:s,stroke:u}),zIndex:200}),new ol.style.Style({stroke:r,zIndex:200})],this.editing=[new ol.style.Style({stroke:o,image:new ol.style.Circle({radius:e,fill:l,stroke:f})}),new ol.style.Style({stroke:d})],this.viewport=[new ol.style.Style({stroke:i}),new ol.style.Style({stroke:new ol.style.Stroke({color:this.colors.white,width:1})})]}),angular.module("dias.annotations").service("viewport",["urlParams",function(t){"use strict";var e={zoom:t.get("z"),center:[t.get("x"),t.get("y")]};this.set=function(n){e.zoom=n.zoom,e.center[0]=Math.round(n.center[0]),e.center[1]=Math.round(n.center[1]),t.set({z:e.zoom,x:e.center[0],y:e.center[1]})},this.get=function(){return e},this.getZoom=function(){return e.zoom},this.getCenter=function(){return e.center}}]);