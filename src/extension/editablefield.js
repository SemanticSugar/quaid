
(function($){

if(!$.editable) return;

/**
 * Q.EditableField - wrap jeditable. Smooth the bumps.
 *
 * EditableField assumes a ton. First you need markup which is an editable element and an edit link.
 * You need an edit link. Your markup will look something like this:
 *
 * <span class="editable" type="date" id="some_data" data="editable_data">Display Data</span>
 * <a href="/path/to/edit/action" class="edit-link" title="Edit this data">edit</a>
 *
 * Then you need to hook up the editable field. All you really need is this:
 * 
 * var field = $('.editable').EditableField({
 *   editLink: $('.edit-link')
 * });
 *
 * When the user clicks edit or double clicks the field, it will be editable. The 'type' attr on
 * the .editable span above will tell the plugin how to display the edit box. available types are.
 * text, textarea, and date.
 *
 * When submitted, the plugin will submit to the link's href. Your action will get 3 params:
 *
 * key=<id_of_editable_field>
 * value=<new_value>
 * <id_of_editable_field>=<new_value>
 *
 * In the example markup above, that would be:
 *
 * POST /path/to/edit/action
 * key=some_data
 * value='new data'
 * some_data='new data'
 *
 * Your action need not return anything special other than a status:success. The new data
 * displayed to the user will come from the value submitted by the user.
 **/
Q.EditableField = Class.extend('EditableField', {
    
    init: function(container, settings){
        var defs = {
            //pass through options
			dateDisable: 'beforeToday',
            event: 'dblclick',
            indicator: '<img src="/i/loaders/16x16_arrows.gif"/>',
            submit: 'Save',
            id: 'key',
            
            dataInterpreter: null,
            
            hoverShowContainer: null,
            
            otherEditLinks: null, //slop. see _showLink()
            editLink: null,
            removeLink: null,
            
            onEdit: function(){},
            onHideLink: function(){},
            onShowLink: function(){},
            onReset: function(){},
            onSuccess: function(){}
        };
        
        this.settings = $.extend({}, defs, settings);
        
        this.container = container;
        
        this._currentVal = this.container.text();
        
        if(!this.settings.editLink)
            $.log('You need an edit link on the editable field:', container);
        
        this._editLink = $.getjQueryObject(this.settings.editLink);
        this._hoverShowContainer = $.getjQueryObject(this.settings.hoverShowContainer);
        this._removeLink = $.getjQueryObject(this.settings.removeLink);
        
        this._setup();
    },
    
    _setup: function(){
        var set = this.settings;
        var self = this;
        
        function showLink(){
            return self._showLink();
        }
        
        if(this._hoverShowContainer){
            function vis(fn){
                self._editLink[fn]();
                if(self._removeLink)
                    self._removeLink[fn]();
            }
            vis('hide');
            this._hoverShowContainer.mouseenter(function(){
                vis('show');
            }).mouseleave(function(){
                vis('hide');
            });
        }
        
        var jedopts = $.extend({}, self.settings, {
            onreset: function(){
                showLink();
                if($.isFunction(self.settings.onReset))
                    self.settings.onReset.apply(self, arguments);
            },
            onsubmit: function(){
                var args = [this];
                for(var i=0; i < arguments.length; i++)
                    args.push(arguments[i]);
                return self._onSubmit.apply(self, args);
            },
            onedit: function(){ return self._onEdit(); },
            ajaxoptions: {
                dataType: 'json',
                applicationError: function(){ return self._onApplicationError.apply(self, arguments); }
            },
            callback: function(){ return self._onSuccess.apply(self, arguments); },
            onerror: function(meow, settings){
                showLink();
            }
        });
        
        var elem = this.container;
        var link = this._editLink;
        
        if(elem.attr('options')){
            jedopts['data'] = elem.attr('options');
            jedopts['type'] = 'select';
        }
        else if(elem.attr('data') != null){
            var d = elem.attr('data').trim();
            jedopts['data'] = d;
            
            self._checkRemoveLinkVisibility(d);
        }
        
        if(elem.attr('type'))
            jedopts['type'] = elem.attr('type');
        
        if(!self.settings.dataInterpreter && elem.attr('interpreter'))
            self.settings.dataInterpreter = elem.attr('interpreter');
        
        elem.editable(link[0].href, jedopts);
        link.click(function(){
            self.edit();
            return false;
        });
        
        if(self._removeLink){
            self._removeLink.click(function(){
                self.container.html(self.settings.indicator);
                $.postJSON(this.href, {}, function(data){
                    self._submittedValue = '';
                    self._onSuccess(data, null);
                });
                return false;
            });
        }
    },
    
    _onEdit: function(){
        this._currentVal = this.container.text();
        this._hideLink();
        if($.isFunction(this.settings.onEdit))
            this.settings.onEdit.apply(this, arguments);
    },
    
    _onSubmit: function(form, settings, wtf){
        var self = this;
        self._showLink();
        
        self._submittedValue = $(form).find(':not(button)').val();
        $.log('valF', self._submittedValue, form, settings, wtf);
        
        return true;
    },
    
    _onApplicationError: function(type, errors){
        
        //for jeditable. FUUUUUUUU!
        this.container[0].editing = false;
        
        //get rid of the indicator
        this.container.html(this._currentVal);
        
        //edit the field
        this.edit();
        
        //make the box have a red border
        this.container.find('input').addClass('error');
        
        //Q.asyncErrors.handle(errors.field);
    },
    
    _onSuccess: function(data, jedSettings){
        
        var self = this;
        var elem = this.container;
        
        //attempt to parse this thing...
        try{
            var val = parseFloat(self._submittedValue);
            if(!isNaN(val))
                self._submittedValue = val;
        }catch(e){}
        
        var display = Q.DataFormatters.get(self.settings.dataInterpreter, self._submittedValue);
        
        elem.html(display);
        
        elem.attr('data', self._submittedValue);
        self._checkRemoveLinkVisibility((''+self._submittedValue).trim());
        if(jedSettings){
            if(jedSettings['type'] == 'select'){
                eval('var d = ' + elem.attr('options')); //yeah yeah.
                d.selected = ''+self._submittedValue;
                jedSettings['data'] = d;
            }
            else
                jedSettings.data = ''+self._submittedValue;
        }
        
        if($.isFunction(this.settings.onSuccess))
            this.settings.onSuccess.apply(this, arguments);
    },
    
    _checkRemoveLinkVisibility: function(val){
        if(this._removeLink && val.length == 0){
            $.data(this._removeLink[0], 'hidden', true);
            this._removeLink.hide();
        }
        else if(this._removeLink && val.length > 0){
            $.data(this._removeLink[0], 'hidden', false);
            this._showLink();
        }
    },
    
    _hideLink: function(){
        if(this._removeLink){
            $.data(this._removeLink[0], 'editing', true);
            this._removeLink.hide();
        }
        $.data(this._editLink[0], 'editing', true);
        this._editLink.hide();
        
        if($.isFunction(this.settings.onHideLink))
            this.settings.onHideLink.apply(this, arguments);
    },
    
    _showLink: function(){
        if(this._removeLink)
            $.data(this._removeLink[0], 'editing', false);
        
        $.data(this._editLink[0], 'editing', false);
        
        //HACK: whatever
        var actuallyShow = !this.settings.otherEditLinks || $(this.settings.otherEditLinks + ':visible').length
        
        if(actuallyShow){
            this._editLink.show();
            if(this._removeLink && !$.data(this._removeLink[0], 'hidden'))
                this._removeLink.show();
        }
        
        if($.isFunction(this.settings.onShowLink))
            this.settings.onShowLink.call(this, actuallyShow);
    },
    
    changeLinkVisibility: function(show){
        
        var links = [this._editLink, this._removeLink];
        
        for(var i = 0; i < links.length; i++){
            var link = links[i];
            if(link && !$.data(link[0], 'editing') && (!show || !$.data(link[0], 'hidden'))){
                link[show ? 'show' : 'hide']();
            }
            
        }
    },
    
    edit: function(){
        this.container.trigger(this.settings.event);
    }
});

if($.fn.DatePicker){
    /**
     * This extends the jeditable types to have a date field. So when they click the
     * field, a date box appears. 
     **/
    $.editable.types.date = $.extend({}, $.editable.types.text, {
        element : function(settings, original) {
            var input = $('<input />');
            input.attr('autocomplete','off');
            $(this).append(input);
            
            if (settings.width  != 'none') { input.width(input.parent().parent().width());  }
            if (settings.height != 'none') { input.height(settings.height); }
            
            return(input);
        },
        content : function(string, settings, original) {
            if($(original).attr('data') != null)
                this.find('input').val($(original).attr('data').trim());
            else
                this.find('input').val(string.trim());
        },
        reset : function(settings, original) {},
        buttons : function(settings, original) {},
        plugin: function(settings, original){
            var form = $(this);
            
            var inp = form.find('input');
            
            var pickerOptions = {
                format: 'b d, Y',
                date: new Date(inp.val()),
                positionRefElement: inp,
                calendars: 1,
                starts: 0,
                onChange: function(formattedDate, dates) {
                    inp.val(formattedDate);
                },
                onRender: function(date){
                    var v = {};
                    var now = new Date();
                    if (settings.dateDisable == 'beforeToday' && date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                        v.disabled = true;
                    } else if (settings.dateDisable == 'beforeTomorrow' && date < new Date(now.getFullYear(), now.getMonth(), now.getDate()+1)) {
                        v.disabled = true;
                    } else if (settings.dateDisable && settings.dateDisable instanceof Date && date < settings.dateDisable) {
                        v.disabled = true;
                    }
                    return v;
                },
                onHide: function(elem, cancel, apply){
                    if(apply)
                        form.submit();
                    else
                        original.reset(this);
                }
            };
            //this is the form
            inp.DatePicker(pickerOptions);
            inp.DatePickerShow();
            
            form.submit(function(){
                inp.DatePickerHide();
            });
        }
    });
}

//
})(jQuery);