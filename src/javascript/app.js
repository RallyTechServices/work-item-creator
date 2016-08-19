Ext.define("WICreator", {
    extend: 'Rally.app.App',
    settingsScope: 'workspace',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'selector_box'},
        {xtype:'container',itemId:'display_box'}
    ],

    integrationHeaders : {
        name : "WICreator"
    },

     //this.getSetting('testCaseType');
    config: {
        defaultSettings: {
            parentFeature:'',
            usName:'',
            tagsOfUS:[],
            planEst:'',
            kanbanProcessField:'',
            kanbanProcessFieldValue:'',
            classOfServiceField:'',
            classOfServiceFieldValue:'',
            storyTypeFieldValue:'',
            showGrid:false
        }
    },

    getSettingsFields: function() {
        var me = this;
        //me.kanbanProcessField = 'ScheduleState';

        return  [
            {
                name: 'showGrid',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 200',
                boxLabel: 'Show Grid<br/><span style="color:#999999;"><i>Tick to show the grid of User Stories for the Feature selected</i></span>'
            },
            {
                name: 'parentFeature',
                xtype: 'rallyartifactsearchcombobox',
                fieldLabel: 'Parent Feature',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: 10,
                allowClear:true,
                storeConfig: {
                    models: ['PortfolioItem/Feature'],
                    limit: 20,
                    pageSize: 20,
                    context:{
                        project:null
                    }
                },
                listCfg: {
                    pageSize:20
                },
                readyEvent: 'ready'
            },
            {
                name: 'usName',
                xtype: 'textfield',
                fieldLabel: 'Default User Story Name',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: 10
            },
            {
                itemId:'tagsOfUS',
                xtype: 'rallytagpicker',
                name: 'tagsOfUS',
                modelType:'Tag',
                fieldLabel: 'Tags',
                labelAlign: 'left',
                showSearchIcon:true,
                labelWidth: 125,
                remoteFilter: true,
                width: 400,
                margin: 10,
                alwaysSelectedValues: me.selectedTags,
                bubbleEvents: ['selectionchange','change'],
                listeners:{
                    added:function(tp){
                        console.log('tags',this,tp,me.selectedTags);
                        this.setValue(me.selectedTags);
                    }
                },
                storeConfig: {
                    limit: 20,
                    pageSize: 20,
                    fetch:['Archived', 'ObjectID', 'Name'],
                    sorters: [
                        {
                            property: 'Name',
                            direction: 'ASC'
                        }
                    ]
                },
                pickerCfg: {
                    style: {
                        border: '1px solid #DDD',
                        'border-top': 'none'
                    },
                    cls: 'tagfilter-picker'
                },
                listType:'Ext.view.BoundList',
                listCfg: {
                    emptyText: '<div class="rui-multi-object-picker-empty-text">No matching tag</div>',
                    cls: 'tagfilter-list',
                    width:400
                }
            },
            {
                xtype:'container',
                tpl:Ext.create('Rally.ui.renderer.template.PillTemplate',{collectionName:'Tags', cls:'tagPill'}),
                itemId:'tagTpl',
                margin: 10,
                data: me.selectedTags,
                handlesEvents: {
                    change: function(tag){
                        this.update({Tags:[]});
                        var data = _.map(tag.getValue(), function(item){
                            return item.getData();
                        });
                        this.update({Tags:data});
                    },
                    selectionchange: function(tag){
                        this.update({Tags:[]});
                        var data = _.map(tag.getValue(), function(item){
                            return item.getData();
                        });
                        this.update({Tags:data});
                    }
                }
            },
            {
                name: 'planEst',
                xtype: 'textfield',
                fieldLabel: 'Plan Estimate',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 50,
                margin: 10
            },
            {
                name: 'kanbanProcessField',
                itemId:'kanbanProcessField',
                xtype: 'rallyfieldcombobox',
                fieldLabel: 'Kanban Process',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: '10 10 10 10',
                model: 'UserStory',
                value: me.getSetting('kanbanProcessField'),
                allowNoEntry: true,
                bubbleEvents: ['kanbanProcessFieldChange'],
                listeners: {
                    ready: function(cb) {
                        me._filterOutWthString(cb.getStore(),'Kanban');
                        //this.fireEvent('kanbanProcessFieldChange',cb);
                    },
                    select: function(cb) {
                        console.log('kanbanProcessFieldChange Fired!');
                        this.fireEvent('kanbanProcessFieldChange',cb);
                    }
                },                
                readyEvent: 'ready'
            },
            {
                name: 'kanbanProcessFieldValue',
                itemId:'kanbanProcessFieldValue',
                xtype: 'rallyfieldvaluecombobox',
                fieldLabel: 'Kanban Process Value',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: '10 10 10 10',
                autoExpand: true,
                alwaysExpanded: true,                
                model: 'UserStory',
                field: me.getSetting('kanbanProcessField'),
                value: me.getSetting('kanbanProcessFieldValue'),
                handlesEvents: {
                    kanbanProcessFieldChange: function(chk){
                        console.log('kanbanProcessFieldChange',chk);
                        var field = chk.getValue();
                        this.field = chk.model.getField(field);
                        if(this.field){
                            this._populateStore();
                        }
                    }
                },
                readyEvent: 'ready'                
            },
            {
                name: 'classOfServiceField',
                itemId:'classOfServiceField',
                xtype: 'rallyfieldcombobox',
                fieldLabel: 'Class of Service',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: '10 10 10 10',
                autoExpand: false,
                alwaysExpanded: false,
                allowNoEntry: true,                
                model: 'UserStory',
                value: me.getSetting('classOfServiceField'),
                bubbleEvents: ['classOfServiceFieldChange'],
                listeners: {
                    ready: function(cb) {
                        me._filterOutWthString(cb.getStore(),'Class');
                    },
                    select: function(cb) {
                        console.log('classOfServiceFieldChange Fired!');
                        this.fireEvent('classOfServiceFieldChange',cb);
                    }
                },                
                readyEvent: 'ready'
            },
            {
                name: 'classOfServiceFieldValue',
                itemId:'classOfServiceFieldValue',
                xtype: 'rallyfieldvaluecombobox',
                fieldLabel: 'Class of Service Value',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: '10 10 10 10',
                autoExpand: false,
                alwaysExpanded: false,                
                model: 'UserStory',
                field: me.getSetting('classOfServiceField'),
                value: me.getSetting('classOfServiceFieldValue'),
                handlesEvents: {
                    classOfServiceFieldChange: function(chk){
                        console.log('classOfServiceFieldChange',chk);
                        var field = chk.getValue();
                        this.field = chk.model.getField(field);
                        if(this.field){
                            this._populateStore();
                        }
                    }
                },
                readyEvent: 'ready'                
            },
            {
                name: 'storyTypeFieldValue',
                itemId:'storyTypeFieldValue',
                xtype: 'rallyfieldvaluecombobox',
                fieldLabel: 'Story Type',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: '10 10 10 10',
                autoExpand: false,
                alwaysExpanded: false,                
                model: 'UserStory',
                field: 'StoryType',
                value: me.getSetting('storyTypeFieldValue'),
                listeners: {
                    ready: function(cb) {
                        cb.setValue(me.getSetting('storyTypeFieldValue'));
                    }
                }, 
                readyEvent: 'ready'                
            }

        ];

    },
    _fetchAllowedValues: function(model, field){
        var deferred = Ext.create('Deft.Deferred');
        model.getField(field).getAllowedValueStore().load({
            callback: function(records, operation, success) {
                if (success){
                          
                    deferred.resolve(records);
                } else {
                    deferred.reject('Error fetching AllowedValues:  ' + operation.error.errors.join(','));
                }
            }
        });
        return deferred;
    },
    _filterOutWthString: function(store,filter_string) {

        var app = Rally.getApp();
        
        store.filter([{
            filterFn:function(field){ 
                if('-- No Entry --' == field.get('name')){
                    return true;
                }
                var attribute_definition = field.get('fieldDefinition').attributeDefinition;
                var attribute_type = null;
                if ( attribute_definition ) {
                    attribute_name = attribute_definition.Name;
                }
                //string.toLowerCase().indexOf(searchstring.toLowerCase())
                if ( attribute_name.toLowerCase().indexOf(filter_string.toLowerCase()) > -1) {
                        return true;
                }
                return false;
            } 
        }]);
    },


    launch: function() {
        var me = this;

        Rally.data.ModelFactory.getModel({
            type: 'UserStory',
            success: function(model){
                me.model = model;
                me._addUSForm();
                if(me._getTags().length > 0){
                    me._loadTags();
                }else{
                    me.selectedTags = []
                }
                if(me.getSetting('showGrid') == true || me.getSetting('showGrid') == "true" ){
                    me._loadStoriesForFeature();
                }
            },
            scope: me
        });

    },

    _loadTags:function(){
        var me = this;
        var deferred = Ext.create('Deft.Deferred');
        
        var model_filters = [];

        Ext.Array.each(me._getTags(),function(tag){
            model_filters.push({property: "ObjectID", value: tag.split("/tag/").pop()});
        });

        if(model_filters.length > 1){
            model_filters = Rally.data.wsapi.Filter.or(model_filters);
        }

        var field_names = ['FormattedID','Name','ObjectID'];

        this._loadAStoreWithAPromise('Tag', field_names,model_filters).then({
            scope: this,
            success: function(records) {
                //console.log('Slected tags',records);
                var result = [];
                if(records.data){
                    Ext.Array.each(records.data.items,function(item){
                    //console.log('each rec',item);
                        result.push(item.data);
                    });                
                }

                //console.log('Reslut arr',result);
                me.selectedTags = result;
            },
            failure: function(error_message){
                alert(error_message);
            }
        }).always(function() {
            me.setLoading(false);
        });

        return deferred;        
    },

    _addUSForm: function(){
        var me = this;
        var selector_box = me.down('#selector_box');
            selector_box.removeAll();
        var currentTime = Ext.Date.format(new Date(), 'm/d/Y g:i:s A');
        var usn =  me.getSetting('usName')+ ' ' + currentTime;
        selector_box.add({
                xtype: 'textfield',
                itemId:'userStoryName',
                name: 'name',
                fieldLabel: 'User Story Name',
                width:400,
                value:usn,
                allowBlank: false  // requires a non-empty value
        });


        selector_box.add({
            xtype: 'rallybutton',
            text: 'Create',
            // width: 200,
            margin:10,
            cls: 'primary',
            listeners: {
                click: me._createUserStories,
                scope: me
            }
        });

    },
    _getTags: function(){
        var tags = this.getSetting('tagsOfUS') || [];
        if (!(tags instanceof Array)){
            tags = tags.split(',');
        }
        return tags;
    },
    _createUserStories: function(){
        //Create a defect record, specifying initial values in the constructor
        var me = this;
        //console.log('Feature >>',me.getSetting('parentFeature'));

        var userSotryRec = {
            Name: me.down('#userStoryName').value,
            ScheduleState:'Defined',
            Project:me.getContext().get('project'),
            Owner:me.getContext().get('user'),
            PortfolioItem:me.getSetting('parentFeature'),
            PlanEstimate:me.getSetting('planEst'),
            c_StoryType:me.getSetting('storyTypeFieldValue')
        }

        userSotryRec[me.getSetting('kanbanProcessField')] = me.getSetting('kanbanProcessFieldValue');
        userSotryRec[me.getSetting('classOfServiceField')] = me.getSetting('classOfServiceFieldValue');

        var record = Ext.create(me.model, userSotryRec);

        record.save({
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    //Get the new defect's objectId
                    var objectId = result.get('ObjectID');

                    var tags = result.getCollection('Tags');
                    tags.load({
                        callback: function() {
                            Ext.Array.each(me._getTags(),function(tag){
                                tags.add(tag);
                            });
                            tags.sync({
                                callback: function() {
                                    //success!
                                }
                            });
                        },
                        scope:me
                    });


                    if(me.getSetting('showGrid') == true || me.getSetting('showGrid') == "true" ){
                        me._loadStoriesForFeature();
                    }

                    // change the value of User Story name txt box with current time.
                        var currentTime = Ext.Date.format(new Date(), 'm/d/Y g:i:s A');
                        var usn =  me.getSetting('usName')+ ' ' + currentTime;
                        me.down('#userStoryName').setValue(usn);    

                }
            },
            scope:me
        });

    },

    _loadStoriesForFeature:function(){
        var me = this;
        var deferred = Ext.create('Deft.Deferred');

        var model_filters = [{property:'PortfolioItem',value:me.getSetting('parentFeature')}];
        var field_names = ['FormattedID','Name','ScheduleState','Project','Owner','Feature','PlanEstimate'];

        this._loadAStoreWithAPromise('UserStory', field_names,model_filters).then({
            scope: this,
            success: function(store) {
                this._displayGrid(store,field_names);
            },
            failure: function(error_message){
                alert(error_message);
            }
        }).always(function() {
            me.setLoading(false);
        });

        return deferred;
    },

    _loadWsapiRecords: function(config){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        var default_config = {
            model: 'Defect',
            fetch: ['ObjectID']
        };
        this.logger.log("Starting load:",config.model);
        Ext.create('Rally.data.wsapi.Store', Ext.Object.merge(default_config,config)).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },

    _loadAStoreWithAPromise: function(model_name, model_fields, model_filters){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        this.logger.log("Starting load:",model_name,model_fields);
          
        Ext.create('Rally.data.wsapi.Store', {
            model: model_name,
            fetch: model_fields,
            filters: model_filters,
            sorters: [
                {
                    property: 'DragAndDropRank',
                    direction: 'ASC'
                }
            ]
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(this);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
    _displayGrid: function(store,field_names){
        this.down('#display_box').removeAll();
        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: field_names
        });
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
