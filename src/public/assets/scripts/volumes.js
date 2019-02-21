Array.isArray(biigle.$require("volumes.stores.filters"))&&biigle.$require("volumes.stores.filters").push({id:"annotations",label:"annotations",help:"All images that (don't) contain annotations.",listComponent:biigle.$require("volumes.components.filterListComponent"),getSequence:function(e){return biigle.$require("annotations.api.volumes").queryImagesWithAnnotations({id:e})}}),Array.isArray(biigle.$require("volumes.stores.filters"))&&biigle.$require("volumes.stores.filters").push({id:"annotationLabels",label:"annotation with label",help:"All images that (don't) contain one or more annotations with the given label.",listComponent:{mixins:[biigle.$require("volumes.components.filterListComponent")],data:function(){return{name:"annotation with label"}}},selectComponent:{mixins:[biigle.$require("volumes.components.filterSelectComponent")],components:{typeahead:biigle.$require("labelTrees.components.labelTypeahead")},data:function(){return{placeholder:"Label name"}},created:function(){biigle.$require("annotations.api.volumes").queryAnnotationLabels({id:this.volumeId}).then(this.gotItems,biigle.$require("messages.store").handleErrorResponse)}},getSequence:function(e,i){return biigle.$require("annotations.api.volumes").queryImagesWithAnnotationLabel({id:e,label_id:i.id})}}),Array.isArray(biigle.$require("volumes.stores.filters"))&&biigle.$require("volumes.stores.filters").push({id:"annotationUser",label:"annotations from user",help:"All images that (don't) contain one or more annotations from the given user.",listComponent:{mixins:[biigle.$require("volumes.components.filterListComponent")],data:function(){return{name:"annotations from user"}}},selectComponent:{mixins:[biigle.$require("volumes.components.filterSelectComponent")],data:function(){return{placeholder:"User name",typeaheadTemplate:'<span v-text="item.name"></span><br><small v-text="item.affiliation"></small>'}},created:function(){biigle.$require("api.volumes").queryUsers({id:this.volumeId}).then(this.parseUsernames,biigle.$require("messages.store").handleErrorResponse).then(this.gotItems)}},getSequence:function(e,i){return biigle.$require("annotations.api.volumes").queryImagesWithAnnotationFromUser({id:e,user_id:i.id})}}),biigle.$declare("annotations.api.volumes",Vue.resource("api/v1/volumes{/id}",{},{queryImagesWithAnnotations:{method:"GET",url:"api/v1/volumes{/id}/images/filter/annotations"},queryImagesWithAnnotationLabel:{method:"GET",url:"api/v1/volumes{/id}/images/filter/annotation-label{/label_id}"},queryImagesWithAnnotationFromUser:{method:"GET",url:"api/v1/volumes{/id}/images/filter/annotation-user{/user_id}"},queryAnnotationLabels:{method:"GET",url:"api/v1/volumes{/id}/annotation-labels"}}));