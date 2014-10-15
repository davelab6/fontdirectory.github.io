// app.js

// create module and include dependencies
var myApp = angular.module(
    'myApp', ['ngRoute', 'ui.bootstrap', 'ui.ace', 'googlechart', 'ngTable', 'ngSanitize', 'routeStyles', 'angularMoment']
);

// #TODO it would be better to get it from .json conf file once and use later.
// Allows to not change code, but rather external file
myApp.constant("appConfig", {
    base_url: '//cdn.rawgit.com', //#TODO should be changed for JSONP,
    git_modules_url: '//cdn.rawgit.com/fontdirectory/collection/master/gitmodules.json',
    data_dir: 'data',
    pages_dir: 'pages',

    app: 'build_info.json',
    repo: 'repo.json',
    metadata: 'METADATA.json',
    metadata_new: 'METADATA.new.json',

    statusMap: {'success': 'OK', 'failure': 'FAIL', 'error': 'ERROR', 'fixed': 'FIXED'},
    resultMap: {'success': 'success', 'failure': 'danger', 'error': 'warning', 'fixed': 'info'},

    fontWeightMap: {
        100: 'Thin',
        200: 'ExtraLight',
        300: 'Light',
        400: '',
        500: 'Medium',
        600: 'SemiBold',
        700: 'Bold',
        800: 'ExtraBold',
        900: 'Black'
    },

    pangram: 'Grumpy wizards make toxic brew for the evil Queen and Jack.'
});


// interceptor of http calls
myApp.factory('httpInterceptor', ['$q', '$location', 'alertsFactory', function($q, $location, alertsFactory) {
    var _config = {};
    return {
        // optional method
        'request': function(config) {
            // do something on success
            _config = config || $q.when(config);
            return _config;
        },

        // optional method
        'requestError': function(rejection) {
            // do something on error
            return $q.reject(rejection);
        },

        // optional method
        'response': function(response) {
            // do something on success
             return response || $q.when(response);
        },

        // optional method
        'responseError': function(rejection) {
            // add alert for every error
            alertsFactory.addAlert(rejection.status + " - " + rejection.statusText + ": " + _config.url);
            return $q.reject(rejection);
        }
    };
}]);

// configure our app
myApp.config(['$routeProvider', '$httpProvider', '$locationProvider', 'appConfig', function($routeProvider, $httpProvider, $locationProvider, appConfig) {
//    $locationProvider.html5Mode(true);
    // configure routes
    $routeProvider
        .when('/', {
            controller : 'reposController',
            title: 'Repos list',
            templateUrl : 'pages/repos_list.html'
        })

        // route for the summary page
        .when('/:repo_owner/:repo_name/', {
            title: 'Summary',
            templateUrl : 'pages/summary.html',
            controller  : 'summaryController',
            css: function(params) {
                if (params.repo_name) {
                    return ['//rawgit.com/' + [params.repo_owner, params.repo_name].join('/') +'/gh-pages/build_info/static/css/faces.css'];
                } else {
                    return [];
                }
            }
        })

        // route for the review page, web fonts tab
        .when('/:repo_owner/:repo_name/review-web-fonts', {
            title: 'Review - Web Fonts',
            templateUrl : 'pages/review-web-fonts.html',
            controller  : 'reviewWebFontsController',
            css: function(params) {
                var links = [
                    'static/css/pages/review.css',
                    'static/css/pages/opentype.css'
                ];
                if (params.repo_name) {
                    var faces = '//rawgit.com/' + [params.repo_owner, params.repo_name].join('/') +'/gh-pages/build_info/static/css/faces.css';
                    links.push(faces);
                }
                return links;
            }
        })

        // route for the review page, glyph inspector tab
        .when('/:repo_owner/:repo_name/review-glyph-inspector', {
            title: 'Review - Glyph Inspector',
            templateUrl : 'pages/review-glyph-inspector.html',
            controller  : 'reviewGlyphInspectorController',
            css: function(params) {
                var links = [
                    'static/css/pages/review.css',
                    'static/css/pages/opentype.css'
                ];
                if (params.repo_name) {
                    var faces = '//rawgit.com/' + [params.repo_owner, params.repo_name].join('/') +'/gh-pages/build_info/static/css/faces.css';
                    links.push(faces);
                }
                return links;
            }
        })

        // route for the checks page
        .when('/:repo_owner/:repo_name/checks', {
            title: 'Pre-Build Checks',
            templateUrl : 'pages/checks.html',
            controller  : 'checksController'
        })

        // route for the tests page
        .when('/:repo_owner/:repo_name/tests', {
            title: 'Tests',
            templateUrl : 'pages/tests.html',
            controller  : 'testsController'
        })

        // route for the build log page
        .when('/:repo_owner/:repo_name/build-log', {
            title: 'Build Log',
            templateUrl : 'pages/build.html',
            controller  : 'buildController',
            css: 'static/css/pages/build-log.css'
        })

        // route for the metadata page
        .when('/:repo_owner/:repo_name/metadata', {
            title: 'Metadata',
            templateUrl : 'pages/metadata.html',
            controller  : 'metadataController',
            css: 'static/css/libs/jsondiffpatch/html.css'
        })

        // route for the bakery yaml page
        .when('/:repo_owner/:repo_name/bakery-yaml', {
            title: 'bakery.yaml',
            templateUrl : 'pages/bakery-yaml.html',
            controller  : 'bakeryYamlController'
        })

        // route for the description page
        .when('/:repo_owner/:repo_name/description', {
            title: 'Description',
            templateUrl : 'pages/description.html',
            controller  : 'descriptionController',
            css: 'static/css/libs/jsondiffpatch/html.css'
        })
        .otherwise({redirectTo: '/'});


    // #TODO: switch to custom cache factory
    // Current caching mechanism brings unexpected results.
    // The response will be stored in a cache named "$http".
    // This cache is created by Angular's $cacheFactory as the default
    // cache for the $http service when Angular boots up.
    // Such behaviour does not fit our needs as it will use the same
    // cache across all fonts opened in one browser.

//    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    // enable default caching
    $httpProvider.defaults.cache = true;
    // intercept http calls
    $httpProvider.interceptors.push('httpInterceptor');

}]);

// change <title> of the pages at runtime
myApp.run(['$location', '$rootScope', function($location, $rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
        $rootScope.current_template = current.$$route.templateUrl;
    });
}]);

myApp.factory('alertsFactory', [function () {
    var alerts = [];
    return {
        getAlerts: function () {
            return alerts;
        },
        addAlert: function (msg, type) {
            alerts.push({ msg: msg , type: type || 'danger'});
        },
        closeAlert: function (index) {
            alerts.splice(index, 1);
        }
    }
}]);

/* Load this now */
google.load('visualization', '1', { packages: ['corechart'] });
// OR ?
//angular.element(document).ready(function() {
//    angular.bootstrap(document, ['myApp']);
//});
