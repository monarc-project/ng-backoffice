angular
    .module('BackofficeApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload',
        'ui.tree', 'ngMessages', 'AnrModule'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', 'localStorageServiceProvider',
             '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext', '$mdAriaProvider', '$locationProvider',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext, $mdAriaProvider, $locationProvider) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('amber');

            // Keep copied with default - allow commonization of theme declarations with the front in ANR module
            $mdThemingProvider.theme('light')
                .primaryPalette('blue')
                .accentPalette('amber');

            $urlRouterProvider.otherwise('/');

            // Globally disables all ARIA warnings.
            $mdAriaProvider.disableWarnings();

            localStorageServiceProvider
                .setStorageType('localStorage');

            $breadcrumbProvider.setOptions({
                template: '<div><span ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract"><a ng-switch-when="false" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a><span ng-switch-when="false"> <md-icon>chevron_right</md-icon> </span><span ng-switch-when="true">{{step.ncyBreadcrumbLabel}}</span></span></div>'
            });

            $locationProvider.hashPrefix('');

            $stateProvider.state('login', {
                url: "/",
                views: {
                    "main": {templateUrl: "views/login.html"}
                }
            }).state('passwordforgotten', {
                url: "/passwordforgotten/:token",
                views: {
                    "main": {templateUrl: "views/passwordforgotten.html"}
                }
            }).state('main', {
                url: "/backoffice",
                redirectTo: 'main.kb_mgmt.info_risk',
                views: {
                    "main": {templateUrl: "views/index.backoffice.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Home"|translate}}'
                }
            }).state('main.account', {
                url: "/account",
                views: {
                    "main@main": {templateUrl: "views/account.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Account"|translate}}'
                }
            }).state('main.admin', {
                url: "/admin",
                views: {},
                ncyBreadcrumb: {
   		    label: '{{"Administration"|translate}}'
                }
            }).state('main.admin.users', {
                url: "/users",
                views: {
                    "main@main": {templateUrl: "views/users.admin.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Manage users"|translate}}'
                }
            }).state('main.admin.servers', {
                url: "/servers",
                views: {
                    "main@main": {templateUrl: "views/servers.admin.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Manage servers"|translate}}'
                }
            }).state('main.admin.logs', {
                url: "/logs",
                views: {
                    "main@main": {templateUrl: "views/logs.admin.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Actions history"|translate}}'
                }
            }).state('main.client_mgmt', {
                url: "/client",
                views: {
                    "main": {templateUrl: "views/index.client_mgmt.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Client management"|translate}}'
                }
            }).state('main.kb_mgmt', {
                url: "/kb",
                redirectTo: 'main.kb_mgmt.info_risk',
                ncyBreadcrumb: {
                    label: '{{"KB management"|translate}}'
                },
            }).state('main.kb_mgmt.info_risk', {
                url: '/info/:tab/:showid',
                params: { tab: { dynamic: true, value: 'assets' },showid: { dynamic: true, value: null }},
                views: {
                    'main@main': {templateUrl: 'views/info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Information risks"|translate}}'
                }
            }).state('main.kb_mgmt.info_risk.object', {
                url: '/object/:objectId',
                views: {
                    'main@main': {templateUrl: 'views/anr/object.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Object details"|translate}}'
                }
            }).state('main.kb_mgmt.models', {
                url: '/models',
                views: {
                    'main@main': {templateUrl: 'views/models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Models"|translate}}'
                }
            }).state('main.kb_mgmt.models.details', {
                url: '/:modelId',
                views: {
                    'main@main': {templateUrl: 'views/anr/anr.layout.html'},
                    'anr@main.kb_mgmt.models.details': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    skip: true
                }
            }).state('main.kb_mgmt.models.details.object', {
                url: '/object/:objectId',
                views: {
                    'anr@main.kb_mgmt.models.details': {templateUrl: 'views/anr/object.html'}
                },
                ncyBreadcrumb: {
                    skip: true
                }
            }).state('main.kb_mgmt.models.details.instance', {
                url: '/inst/:instId',
                views: {
                    'anr@main.kb_mgmt.models.details': {templateUrl: 'views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    skip: true
                }
            }).state('main.kb_mgmt.op_risk', {
                url: '/op/:tab',
                params: { tab: { dynamic: true, value: 'tags' }},
                views: {
                    'main@main': {templateUrl: 'views/op_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Operational risks"|translate}}'
                }
            }).state('main.kb_mgmt.deliveries_models', {
                url: '/deliveriesmodels',
                views: {
                    'main@main': {templateUrl: 'views/deliveries_models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Deliverable templates"|translate}}'
                }
            }).state('main.kb_mgmt.questions', {
                url: '/questions',
                views: {
                    'main@main': {templateUrl: 'views/questions.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Questions of trends assessment"|translate}}'
                }
            }).state('main.kb_mgmt.analysis_guides', {
                url: '/guides',
                views: {
                    'main@main': {templateUrl: 'views/analysis_guides.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Helpful informations"|translate}}'
                }
            }).state('main.kb_mgmt.analysis_guides.items', {
                url: '/:guideId',
                views: {
                    'main@main': {templateUrl: 'views/items.analysis_guides.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Guide contents"|translate}}'
                }
            });

            $provide.factory('monarcHttpInter', ['$injector', function ($injector) {
                return {
                    'request': function (config) {
                        // UserService depends on $http, which causes a circular dependency inside a $http interceptor
                        var UserService = $injector.get('UserService');
                        var $http = $injector.get('$http');

                        if (!UserService.isAuthenticated()) {
                            UserService.reauthenticate();
                        }


                        if (UserService.isAuthenticated()) {
                            config.headers.token = UserService.getToken();
                        }

                        return config;
                    },

                    'responseError': function (response) {
                        let i;
                        var ErrorService = $injector.get('ErrorService');

                        if (response.status === 401) {
                            const state = $injector.get('$state');
                            state.transitionTo('login');
                        } else if (response.status === 403) {
                            const resourceUrl = response.config.url;
                            if (resourceUrl) {
                                ErrorService.notifyError('This resource is forbidden: ' + resourceUrl);
                            } else {
                                ErrorService.notifyError('Unauthorized operation occurred.');
                            }
                        } else if (response.status === 400) {
                            for (i = 0; i < response.data.errors.length; ++i) {
                                const messages = JSON.parse(response.data.errors[i].message);
                                let validationErrors = '';
                                if (messages.hasOwnProperty('row')) {
                                    // TODO: 1. Translation, 2. New lines after the messages or use a file template.
                                    // gettextCatalog.getString('Validation errors in row')
                                    validationErrors += 'Validation errors in row' + ' #'
                                      + messages.row + "\r\n";
                                } else {
                                    validationErrors += 'Input data validation errors: \r\n';
                                }
                                if (messages.hasOwnProperty('validationErrors')) {
                                    for (const [field, fieldMessage] of Object.entries(messages.validationErrors)) {
                                        validationErrors += '[' + field + "] :\r\n";
                                        for (const message of fieldMessage) {
                                            validationErrors += '- ' + message + "\r\n";
                                        }
                                    }
                                }
                                ErrorService.notifyError(validationErrors);
                            }
                        } else if (response.status === 412) {
                            // Human-readable error, with translation support
                            for (i = 0; i < response.data.errors.length; ++i) {
                                ErrorService.notifyError(response.data.errors[i].message);
                            }
                        } else if (response.status >= 400 && response.config.url.indexOf('auth') < 0) {
                            var message = response.status;
                            var url = response.config.url;

                            // Either get our own custom error message, or Zend default error message
                            if (response.data && response.data.message) {
                                message = response.data.message;
                            } else if (response.data && response.data.errors && response.data.errors.length > 0) {
                                message = response.data.errors[0].message;
                            }

                            if (url.indexOf('?') > 0) {
                                url = url.substring(0, url.indexOf('?'));
                            }

                            ErrorService.notifyFetchError(url, message + " (" + response.status + ")");
                        }

                        var $q = $injector.get('$q');
                        return $q.reject(response);
                    }
                }
            }]);
            $httpProvider.interceptors.push('monarcHttpInter');
        }]).
    run(['ConfigService', 'UserService', 'gettextCatalog', '$rootScope',
        function (ConfigService, UserService, gettextCatalog, $rootScope) {
            $rootScope.OFFICE_MODE = 'BO';

            ConfigService.loadConfig(function () {
                $rootScope.languages = ConfigService.getLanguages();
                var uiLang = UserService.getUiLanguage();
                $rootScope.mospApiUrl = ConfigService.getMospApiUrl();

                if (uiLang === undefined || uiLang === null) {
                    gettextCatalog.setCurrentLanguage('en');
                    $rootScope.uiLanguage = 'gb';
                } else {
                    gettextCatalog.setCurrentLanguage($rootScope.languages[uiLang].code);
                    $rootScope.uiLanguage = $rootScope.languages[uiLang].flag;
                }

                $rootScope.updatePaginationLabels();
            });

            $rootScope._langField = function (obj, field) {
                if (!obj) {
                    return '';
                } else {
                    var uiLang = UserService.getUiLanguage();
                    if (!field) {
                        return obj + (uiLang ? uiLang : ConfigService.getDefaultLanguageIndex());
                    } else {
                        if (!obj[field + uiLang] || obj[field + uiLang] === '') {
                            return obj[field + ConfigService.getDefaultLanguageIndex()];
                        } else {
                            return obj[field + uiLang];
                        }
                    }
                }
            };

            $rootScope.range = function (x,y) {
                var out = [];
                for (var i = x; i <= y; ++i) {
                    out.push(i);
                }
                return out;
            };

            $rootScope.getUrlAnrId = function () {
                // Stub, used only in FO
                return undefined;
            };

            // Setup dialog-specific scope based on the rootScope. This is mostly used to have access to _langField
            // in dialog views as well without having to manually declare it every time. We clone the scope so that
            // dialog have their distinct scope and avoid editing the parent one.
            $rootScope.$dialogScope = $rootScope.$new();

            // Method to update pagination labels globally when switching language in account settings
            $rootScope.updatePaginationLabels = function () {
                $rootScope.paginationLabels = {
                    page: gettextCatalog.getString('Page:'),
                    rowsPerPage: gettextCatalog.getString('Rows per page:'),
                    of: gettextCatalog.getString('of')
                }
            }

            $rootScope.updatePaginationLabels();

            //Handle rejection when close/ESC a $mdDialog
            $rootScope.handleRejectionDialog = function(reject) {
              if(reject !== undefined) throw reject;
            }

            //Get language code by index
            $rootScope.getLanguageCode = function(index) {
              return $rootScope.languages[index].code;
            }
        }
    ]);
