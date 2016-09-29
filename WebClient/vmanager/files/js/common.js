//The build will inline common dependencies into this file.

//For any third party dependencies, like jQuery, place them in the lib folder.

//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    baseUrl: 'files/js/lib',
	waitSeconds: 0,
    paths: {
        app: '../app'
    },
    shim: {
		
        backbone: {
            deps: ['underscore'],
            exports: 'Backbone'
        },
        marionette : {
            deps : ['backbone.wreqr','backbone.babysitter']
        },
        underscore: {
            exports: '_'
        },
		polyglot:{
			exports: "Polyglot"
		},
		raphael:{
			exports: "Raphael"
		},
		is:{
			exports: "is"
		},
		arcticmodal: {
			deps: ['jquery'],
			exports: 'arcticmodal'
		},
    }
});

