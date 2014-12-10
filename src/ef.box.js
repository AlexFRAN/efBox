/**
 *  @author Alex Franzelin
 *  @license Mit License
 *  @version 0.1
 *
 *  jQuery lightbox plugin, written for encaleo, ATTENTION: pre-alpha, quickndirty written plugin, will be rewritten
 **/
if(typeof ef == 'undefined') {
    var ef = {};
}

ef.box =
{
    config:
    {
        selector:
        {
            base: '.efBox',     // The basic efBox selector
            type: true,     // Will set the type (image/inline) depending on class .image or .inline
            gallery: 'data-gallery'  // When transitioning to html5 this will be used as gallery attribute
        },
        
        errors:     // the error messages that will show up if the content cannot be loaded
        {
            image: 'Error while loading image.',
            inline: 'Error while loading content.'
        },
        
        resizeDynamic: true,        // resizes efBox on window resize
        margin: [60, 70, 60, 70],   // margin: top right bottom left
        padding: [0, 0, 0, 0],    // padding: top right bottom left
        type: 'image',              // 'image', 'inline'
        width: null,                // if width or height ar set, efBox will use them to create a box with absolute dimensions
        height: null,
        minWidth: 200,              // minimum div width
        minHeight: 400,             // minimum div height
        navArrows: true,            // in galleries use navigation arrows
        speed: 200,                 // the speed wich will be used to fadein/out the box
        resizeSpeed: 400,           // the speed with wich the box will be resized
        closeButton: true,          // include closebutton
        modal: false                // if set to true, click on background will not close the box
    },
    
    values:
    {
        wWidth: 0,          // browser window width
        wHeight: 0,         // browser window height
        maxWidth: 0,        // max height the image can be
        maxHeight: 0,       // max height the image can be
        maxDivWidth: 0,     // max height the container can be
        maxDivHeight: 0,    // max height the container can be
        lWidth: 0,          // final calculated width
        lHeight: 0,         // final calculated height
        left: 0,            // how many pixels top so that div is centered
        top: 0,             // how many pixels left so that div is centered
        img: {},            // in here will be saved the image object
        content: '',        // efBox content
        closed: true,       // closed flag, used if a user clicks the bg when the image is still loading
        loading: false,     // is something loading (animated gif shown?)
        gallery: false,     // gallery flag, if clicked image is gallery then true
        index: null,        // the current gallery index
        galleries: {}       // in here will be saved the galleries
    },
    
    manualOptions:
    {
        content: '',
        autoWidth: true,
        autoHeight: true,
        width: 800,
        height: 600,
        
        selector:
        {
            base: '.efBox',     // The basic efBox selector
            type: true,     // Will set the type (image/inline) depending on class .image or .inline
            gallery: 'data-gallery'  // When transitioning to html5 this will be used as gallery attribute
        },
        
        errors:     // the error messages that will show up if the content cannot be loaded
        {
            image: 'Error while loading image.',
            inline: 'Error while loading content.'
        },
        
        resizeDynamic: true,        // resizes efBox on window resize
        margin: [60, 70, 60, 70],   // margin: top right bottom left
        padding: [0, 0, 0, 0],    // padding: top right bottom left
        type: 'image',              // 'image', 'inline'
        minWidth: 700,              // minimum div width
        minHeight: 400,             // minimum div height
        navArrows: true,            // in galleries use navigation arrows
        speed: 200,                 // the speed wich will be used to fadein/out the box
        resizeSpeed: 400,           // the speed with wich the box will be resized
        closeButton: true,          // include closebutton
        modal: false                // if set to true, click on background will not close the box
    },
    
    init: function(config)
    {
        this.configure(config);
        
        if(jQuery('#efBox').length <= 0)
        {
            this.attach();
        }
        
        this.attachEvents();
    },
    
    // Attaches the base html to the body
    attach: function()
    {
        jQuery('body').append('<div id="efBox"></div><div id="efBoxOverlay"></div><div id="efBoxLoading"></div>');
        jQuery('#efBox').append('<div class="efBoxContent"></div><div class="efBoxClose"></div><div class="efBoxPrev efBoxArrow"></div><div class="efBoxNext efBoxArrow"></div>');
        if(this.config.modal == false)
        {
            jQuery('#efBoxOverlay').on('click', this.closeBox);
        }
    },
    
    // Attaches the event-handlers to the various objects
    attachEvents: function()
    {
        jQuery(document).on('click', this.config.selector.base, function(e)
        {
            e.preventDefault();
            $this = jQuery(this);
            ef.box.getMaxBoxSize();
            ef.box.getMaxImageSize();
            
            if($this.data('width')) {
                ef.box.config.width = $this.data('width');
            }
            
            if($this.data('height')) {
                ef.box.config.height = $this.data('height');
            }
            
            if(ef.box.config.type == 'image' && (!$this.data('type') || $this.data('type') == 'image')) {
                if( typeof $this.attr(ef.box.config.selector.gallery) != 'undefined') {
                    var gallery = $this.attr(ef.box.config.selector.gallery);
                    ef.box.values.gallery = gallery;
                    
                    if(typeof ef.box.values.galleries[gallery] == 'undefined') {
                        ef.box.values.galleries[gallery] = jQuery('a['+ef.box.config.selector.gallery+'='+gallery+']');
                    }
                    
                    ef.box.values.index = ef.box.values.galleries[gallery].index(jQuery(this));
                }
                else {
                    ef.box.values.gallery = false;
                    ef.box.values.index = null;
                }
                
                ef.box.loadImage($this.attr('href'));
            }
            else if(ef.box.config.type == 'iframe' || $this.data('type') == 'iframe') {
                var divHeight = ef.box.config.height;
                
                if(ef.box.values.maxDivHeight < ef.box.config.height) {
                    divHeight = ef.box.values.maxDivHeight;
                }
                
                divHeight += 40;
                
                ef.box.values.divHeight = divHeight;
                ef.box.values.content = '<iframe src="'+$this.attr('href')+'" width="'+ef.box.config.width+'" height="'+divHeight+'"></iframe>';
                
                ef.box.showBox('iframe');
            }
        });
        
        // Navigation arrows
        jQuery(document).on('click', '.efBoxArrow', function(e) {
            $this = jQuery(this);
            ef.box.getMaxBoxSize();
            ef.box.getMaxImageSize();
            
            var gallery = $this.attr('data-name');
            var index = parseInt($this.attr('data-index'));
            
            if(typeof ef.box.values.galleries[gallery] == 'undefined')
            {
                return false;
            }
            
            if($this.hasClass('efBoxPrev'))
            {
                ef.box.go(gallery, index);
            }
            else
            {
                ef.box.go(gallery, index);
            }
        });
        
        // Close button
        jQuery(document).on('click', '.efBoxClose', function(e)
        {
            ef.box.closeBox();
        });
        
        $(document).on('keyup', function(e) {
            if (ef.box.values.closed == false) {
                if (e.keyCode == 27) {  // Esc key
                    ef.box.closeBox();
                }
                else if (e.keyCode == 37 && typeof ef.box.values.gallery != 'undefined') {
                    if(ef.box.values.index > 0) {
                        ef.box.go(ef.box.values.gallery, ef.box.values.index - 1);     // Left arrow
                    }
                }
                else if (e.keyCode == 39 && typeof ef.box.values.gallery != 'undefined' && typeof ef.box.values.galleries[ef.box.values.gallery] != 'undefined') {
                    if(ef.box.values.index < (ef.box.values.galleries[ef.box.values.gallery].length - 1)) {
                        ef.box.go(ef.box.values.gallery, ef.box.values.index + 1);     // Right arrow
                    }
                }
            }
        });
    },
    
    go: function(gallery, index)
    {
        ef.box.showLoading();
        ef.box.hideContent();
        ef.box.removeContent();
        ef.box.hidePrev();
        ef.box.hideNext();
        ef.box.values.gallery = gallery;
        ef.box.values.index = index;
        ef.box.loadImage(ef.box.values.galleries[gallery][index].href, 'changeImage');
    },
    
    configure: function(config)
    {
        jQuery.extend(this.config, config);
        
        if(this.config.resizeDynamic == true)
        {
            window.onresize = function(event)
            {
                ef.box.getWindowSize();
            }
        }
    },
    
    loadImage: function(url, callback)
    {
        var img = new Image();
        this.values.closed = false;
        ef.box.values.img = null;
        ef.box.showLoading();
        
        jQuery('#efBoxOverlay').fadeIn(ef.box.config.speed);
        
        
        img.onload = function()
        {
            ef.box.hideLoading();
            ef.box.values.img = img;
            
            if(typeof callback == 'undefined')
            {
                ef.box.contentLoaded(ef.box.config.type);
            }
            else
            {
                ef.box[callback]();
            }
        };
        
        img.onerror = function()
        {
            ef.box.contentError('image');
        };
        
        img.src = url;
    },
    
    changeImage: function()
    {
        var attr = ef.box.calcImageSize();
        ef.box.values.content = '<img src="'+ef.box.values.img.src+'" '+attr+' alt="img" />';
        jQuery('.efBoxContent').html(ef.box.values.content);
        ef.box.setBoxSize(true, 'showContent');
    },
    
    calcBoxSize: function(iHeight, iWidth, config)
    {
        var hRatio = ef.box.values.maxHeight / iHeight;
        var wRatio = ef.box.values.maxWidth / iWidth;
        var attr = '';
        
        if(iWidth > ef.box.values.maxWidth)
        {
            if(iHeight > ef.box.values.maxHeight)
            {
                if((hRatio * iWidth) <= ef.box.values.maxWidth)
                {
                    attr = 'height="'+ef.box.values.maxHeight+'"';
                    
                    ef.box.values.lWidth = hRatio * iWidth + ef.box[config].padding[1] + ef.box[config].padding[3];
                    ef.box.values.lHeight = ef.box.values.maxHeight + ef.box[config].padding[0] + ef.box[config].padding[2];
                    
                    ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
                    ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
                }
                else
                {
                    attr = 'width="'+ef.box.values.maxWidth+'"';
                    
                    ef.box.values.lWidth = ef.box.values.maxWidth + ef.box[config].padding[1] + ef.box[config].padding[3];
                    ef.box.values.lHeight = wRatio * iHeight + ef.box[config].padding[0] + ef.box[config].padding[2];
                    
                    ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
                    ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
                }
            }
            else
            {
                attr = 'width="'+ef.box.values.maxWidth+'"';
                
                ef.box.values.lWidth = ef.box.values.maxWidth + ef.box[config].padding[1] + ef.box[config].padding[3];
                ef.box.values.lHeight = wRatio * iHeight + ef.box[config].padding[0] + ef.box[config].padding[2];
                
                ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
                ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
            }
        }
        else if(iHeight > ef.box.values.maxHeight)
        {
            attr = 'height="'+ef.box.values.maxHeight+'"';
            
            ef.box.values.lWidth = hRatio * iWidth + ef.box[config].padding[1] + ef.box[config].padding[3];
            ef.box.values.lHeight = ef.box.values.maxHeight + ef.box[config].padding[0] + ef.box[config].padding[2];
            
            ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
            ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
        }
        else
        {
            ef.box.values.lWidth = iWidth + ef.box[config].padding[1] + ef.box[config].padding[3];
            ef.box.values.lHeight = iHeight + ef.box[config].padding[0] + ef.box[config].padding[2];
            
            ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
            ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
        }
        
        return attr;
    },
    
    calcManualBoxSize: function()
    {
        if(ef.box.manualOptions.autoWidth == true)
        {
            ef.box.values.lWidth = ef.box.values.maxDivWidth;
        }
        else
        {
            ef.box.values.lWidth = ef.box.manualOptions.width;
        }
        
        if(ef.box.manualOptions.autoHeight == true)
        {
            ef.box.values.lHeight = ef.box.values.maxDivHeight;
        }
        else
        {
            ef.box.values.lHeight = ef.box.manualOptions.height;
        }
        
        var distHoriz = ef.box.manualOptions.padding[1] + ef.box.manualOptions.padding[3] + ef.box.manualOptions.margin[1] + ef.box.manualOptions.margin[3];
        var totalWidth = ef.box.values.maxDivWidth + distHoriz;
        var distVert = ef.box.manualOptions.padding[0] + ef.box.manualOptions.padding[2] + ef.box.manualOptions.margin[0] + ef.box.manualOptions.margin[2];
        var totalHeight = ef.box.values.maxDivHeight + distVert;
        
        if(totalWidth > ef.box.values.wWidth)
        {
            ef.box.values.left = 20;
        }
        else
        {
            ef.box.values.left = (ef.box.values.wWidth - ef.box.values.lWidth) / 2;
        }
        
        if(totalHeight >= ef.box.values.wHeight)
        {
            ef.box.values.top = 20;
        }
        else
        {
            ef.box.values.top = (ef.box.values.wHeight - ef.box.values.lHeight) / 2;
        }
    },
    
    calcImageSize: function()
    {
        var iHeight = ef.box.values.img.height;
        var iWidth = ef.box.values.img.width;
        
        return this.calcBoxSize(iHeight, iWidth, 'config');
    },
    
    calcContentSize: function()
    {
        return this.calcManualBoxSize();
    },
    
    contentLoaded: function(type)
    {
        if(ef.box.values.closed == true)
        {
            return false;
        }
        
        if(type == 'image')
        {
            attr = ef.box.calcImageSize();
            ef.box.values.content = '<img src="'+ef.box.values.img.src+'" '+attr+' alt="img" />';
            ef.box.showBox();
        }
        else if(type == 'inline')
        {
            
        }
        else if(type == 'hybrid')
        {
            
        }
    },
    
    contentError: function(type)
    {
        if(type == 'image')
        {
            this.values.content = this.config.errors.image;
        }
        else if(type == 'inline')
        {
            this.values.content = this.config.errors.inline;
        }
        
        this.showBox('error');
    },
    
    getWindowSize: function()
    {
        this.values.wWidth = jQuery(window).width();
        this.values.wHeight = jQuery(window).height();
    },
    
    // This function calculates the max box size depending on the window size etc.
    getMaxBoxSize: function()
    {
        this.getWindowSize();
        this.values.maxDivWidth = this.values.wWidth - (this.config.margin[1] + this.config.margin[3]);
        this.values.maxDivHeight = this.values.wHeight - (this.config.margin[0] + this.config.margin[2]);
    },
    
    // This function gets the maximum image size, call getMaxBoxSize first!
    getMaxImageSize: function()
    {
        this.values.maxWidth = this.values.maxDivWidth - (this.config.padding[1] + this.config.padding[3]);
        this.values.maxHeight = this.values.maxDivHeight - (this.config.padding[0] + this.config.padding[2]);
    },
    
    // Same functionality, but for inline lightboxes
    getMaxDivSize: function()
    {
        this.values.maxWidth = this.values.maxDivWidth - (this.config.padding[1] + this.config.padding[3]);
        this.values.maxHeight = this.values.maxDivHeight - (this.config.padding[0] + this.config.padding[2]);
    },
    
    // This function sets the box-size
    setBoxSize: function(animate, callback)
    {
        var properties =
        {
            width: this.values.lWidth,
            height: this.values.lHeight,
            top: this.values.top,
            left: this.values.left
        };
        
        if(animate == true)
        {
            if(typeof callback == 'undefined')
            {
                jQuery('#efBox').animate(properties, this.config.resizeSpeed);
            }
            else
            {
                jQuery('#efBox').animate(properties, this.config.resizeSpeed, 'linear', ef.box[callback]);
            }
        }
        else
        {
            jQuery('#efBox').css(properties);
            
            if(typeof callback != 'undefined')
            {
                ef.box[callback];
            }
        }
    },
    
    showLoading: function()
    {
        if(this.values.loading == false)
        {
            this.values.loading = true;
            jQuery('#efBoxLoading').fadeIn(this.config.speed);
        }
    },
    
    hideLoading: function()
    {
        if(this.values.loading == true)
        {
            this.values.loading = false;
            jQuery('#efBoxLoading').fadeOut(this.config.speed);
        }
    },
    
    showPrev: function(gallery, index)
    {
        jQuery('.efBoxPrev').attr('data-name', gallery).attr('data-index', (index-1)).show();
    },
    
    hidePrev: function()
    {
        jQuery('.efBoxPrev').attr('data-name', '').attr('data-index', '').hide();
    },
    
    showNext: function(gallery, index)
    {
        jQuery('.efBoxNext').attr('data-name', gallery).attr('data-index', (index+1)).show();
    },
    
    hideNext: function()
    {
        jQuery('.efBoxNext').attr('data-name', '').attr('data-index', '').hide();
    },
    
    
    // Manages the arrows, prev+next, shows them if necessary
    arrows: function()
    {
        if(ef.box.values.gallery != false)
        {
            if(ef.box.values.index > 0)
            {
                ef.box.showPrev(ef.box.values.gallery, ef.box.values.index);
            }
            else
            {
                ef.box.hidePrev();
            }
            
            if(ef.box.values.index < (ef.box.values.galleries[ef.box.values.gallery].length - 1))
            {
                ef.box.showNext(ef.box.values.gallery, ef.box.values.index);
            }
            else
            {
                ef.box.hideNext();
            }
        }
    },
    
    showBox: function(cssClass)
    {
        jQuery('.efContent').attr('class', 'efcontent '+cssClass);
        jQuery('#efBox .efBoxContent').html(this.values.content);
        
        if(cssClass == 'iframe') {
            jQuery('.efBoxClose').addClass('hidden');
            var left = (ef.box.values.maxDivWidth - ef.box.config.width) / 2;
            jQuery('#efBox').css({
                'left': left+'px',
                'top': '10px',
                'box-shadow': '0px 0px 10px #000',
                'width': ef.box.config.width,
                'height': ef.box.values.divHeight
            });
        }
        
        jQuery('#efBoxOverlay').fadeIn(ef.box.config.speed);
        jQuery('#efBox').fadeIn(ef.box.config.speed);
        
        ef.box.arrows();
        
        if(cssClass != 'iframe') {
            this.setBoxSize();
        }
    },
    
    closeBox: function()
    {
        ef.box.values.closed = true;
        ef.box.hideLoading();
        jQuery('#efBoxOverlay').fadeOut(200);
        jQuery('#efBox').fadeOut(200, function()
        {
            $(this).children('.efBoxContent').html('');
        });
    },
    
    showContent: function()
    {
        jQuery('.efBoxContent').fadeIn(ef.box.config.speed);
        
        if(ef.box.config.navArrows == true && ef.box.values.gallery != false)
        {
            if(ef.box.values.index > 0)
            {
                ef.box.showPrev(ef.box.values.gallery, ef.box.values.index);
            }
            
            if(ef.box.values.index < (ef.box.values.galleries[ef.box.values.gallery].length - 1))
            {
                ef.box.showNext(ef.box.values.gallery, ef.box.values.index);
            }
        }
    },
    
    hideContent: function()
    {
        jQuery('.efBoxContent').hide();
    },
    
    removeContent: function()
    {
        jQuery('.efBoxContent').html('');
    },
    
    /**
     *  Functions to open efBox manually
     **/
    openManually: function(options, callback)
    {
        jQuery.extend(this.manualOptions, options);
        
        this.getWindowSize();
        this.getMaxBoxSize();
        this.getMaxDivSize();
        this.calcContentSize();
        
        if(jQuery('.efBoxContent').length <= 0)
        {
            this.attach();
        }
        
        this.values.content = this.manualOptions.content;
        this.showBox();
        callback();
    }
};