Ext.define("WICreator", {
    extend: 'Rally.app.App',
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
            planEst:'',
            usName:'',
            showGrid:false
        }
    },

    getSettingsFields: function() {
        var me = this;

        return [
            {
                name: 'parentFeature',
                xtype: 'rallycombobox',
                fieldLabel: 'Parent Feature',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: 10,
                autoExpand: false,
                alwaysExpanded: false,                
                store:me.parentFeatures,
                readyEvent: 'ready'
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
                name: 'usName',
                xtype: 'textfield',
                fieldLabel: 'Default User Story Name',
                labelWidth: 125,
                labelAlign: 'left',
                minWidth: 200,
                margin: 10
            },
            {
                name: 'showGrid',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 200',
                boxLabel: 'Show Grid<br/><span style="color:#999999;"><i>Tick to show the grid of User Stories for the Feature selected</i></span>'
            }

        ];
    },


                        
    launch: function() {
        var me = this;

        var model_filter = [{property:'Project.ObjectID',value:me.getContext().get('project').ObjectID}];

        Rally.data.ModelFactory.getModel({
            type: 'UserStory',
            success: function(model){
                me.model = model;
                me._addUSForm();
                me._loadAStoreWithAPromise('PortfolioItem/Feature',['ObjectID','Name'],model_filter).then({
                    scope:me,
                    success:function(store){
                        console.log('features>>',store);
                        me.parentFeatures = store;
                    }
                });
            },
            scope: me
        });


        // this.setLoading("Loading stuff...");
        
        // var model_name = 'Defect',
        //     field_names = ['Name','State'];
        
        // this._loadAStoreWithAPromise(model_name, field_names).then({
        //     scope: this,
        //     success: function(store) {
        //         this._displayGrid(store,field_names);
        //     },
        //     failure: function(error_message){
        //         alert(error_message);
        //     }
        // }).always(function() {
        //     me.setLoading(false);
        // });
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

    _createUserStories: function(){
        //Create a defect record, specifying initial values in the constructor
        var me = this;
        //console.log('Feature >>',me.getSetting('parentFeature'));
        var currentTime = Ext.Date.format(new Date(), 'm/d/Y g:i:s A');
        var usn =  me.getSetting('usName')+ ' ' + currentTime;
        me.down('#userStoryName').setValue(usn);

        var record = Ext.create(me.model, {
            Name: me.down('#userStoryName').value,
            ScheduleState:'Defined',
            Project:me.getContext().get('project'),
            Owner:me.getContext().get('user'),
            PortfolioItem:me.getSetting('parentFeature'),
            PlanEstimate:me.getSetting('planEst')
        });

        record.save({
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    //Get the new defect's objectId
                    var objectId = result.get('ObjectID');
                    if(me.getSetting('showGrid') == true || me.getSetting('showGrid') == "true" ){
                        var model_filters = [{property:'PortfolioItem',value:me.getSetting('parentFeature')}];
                        var field_names = ['Name','ScheduleState','Project','Owner','Feature','PlanEstimate']

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
                    }
                    // me.down('selector_box').removeAll();
                    // me._addUSForm();
                    // var msg = 'User Story '+ me.down('#userStoryName').value + ' with (ObjectID - ' + objectId + ') created! ';
                    // me.down('selector_box').add({
                    //     xtype: 'text',
                    //     text: msg,
                    //     id:'successMsg'
                    // });
                }
            },
            scope:me
        });

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
            filters: model_filters
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
