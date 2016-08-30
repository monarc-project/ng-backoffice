angular
    .module('BackofficeApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload', 'angularInlineEdit',
        'ui.tree', 'ngMessages', 'AnrModule'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('amber');

            $urlRouterProvider.otherwise('/');

            localStorageServiceProvider
                .setStorageType('sessionStorage');

            $breadcrumbProvider.setOptions({
                template: '<div><span ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract"><a ng-switch-when="false" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a><span ng-switch-when="false"> <md-icon>chevron_right</md-icon> </span><span ng-switch-when="true">{{step.ncyBreadcrumbLabel}}</span></span></div>'
            });

            $stateProvider.state('login', {
                url: "/",
                views: {
                    "main": {templateUrl: "/views/login.html"}
                }
            }).state('passwordforgotten', {
                url: "/passwordforgotten/:token",
                views: {
                    "main": {templateUrl: "/views/passwordforgotten.html"}
                }
            }).state('main', {
                url: "/backoffice",
                views: {
                    "main": {templateUrl: "/views/index.backoffice.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Home')
                }
            }).state('main.account', {
                url: "/account",
                views: {
                    "main@main": {templateUrl: "/views/account.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Account')
                }
            }).state('main.admin', {
                url: "/admin",
                views: {},
                ncyBreadcrumb: {
                    label: gettext('Administration')
                }
            }).state('main.admin.users', {
                url: "/users",
                views: {
                    "main@main": {templateUrl: "/views/users.admin.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Users management')
                }
            }).state('main.admin.servers', {
                url: "/servers",
                views: {
                    "main@main": {templateUrl: "/views/servers.admin.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Servers management')
                }
            }).state('main.admin.logs', {
                url: "/logs",
                views: {
                    "main@main": {templateUrl: "/views/logs.admin.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Actions history')
                }
            }).state('main.client_mgmt', {
                url: "/client",
                views: {
                    "main": {templateUrl: "/views/index.client_mgmt.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Client management')
                }
            }).state('main.kb_mgmt', {
                url: "/kb",
                ncyBreadcrumb: {
                    label: gettext('KB management')
                },
            }).state('main.kb_mgmt.info_risk', {
                url: '/info/:tab',
                params: { tab: { dynamic: true, value: 'assets' }},
                views: {
                    'main@main': {templateUrl: '/views/info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Information risks')
                }
            }).state('main.kb_mgmt.info_risk.object', {
                url: '/object/:objectId',
                views: {
                    'main@main': {templateUrl: '/views/object.info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Object details')
                }
            }).state('main.kb_mgmt.models', {
                url: '/models',
                views: {
                    'main@main': {templateUrl: '/views/models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Models')
                }
            }).state('main.kb_mgmt.models.details', {
                url: '/:modelId',
                views: {
                    'main@main': {templateUrl: '/views/anr/anr.layout.html'},
                    'anr@main.kb_mgmt.models.details': {templateUrl: '/views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Model details')
                }
            }).state('main.kb_mgmt.models.details.object', {
                url: '/object/:objectId',
                views: {
                    'anr@main.kb_mgmt.models.details': {templateUrl: '/views/object.info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Object information')
                }
            }).state('main.kb_mgmt.models.details.instance', {
                url: '/inst/:instId',
                views: {
                    'anr@main.kb_mgmt.models.details': {templateUrl: '/views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Object instance')
                }
            }).state('main.kb_mgmt.op_risk', {
                url: '/op/:tab',
                params: { tab: { dynamic: true, value: 'categories' }},
                views: {
                    'main@main': {templateUrl: '/views/op_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Operational risks')
                }
            }).state('main.kb_mgmt.doc_models', {
                url: '/docs',
                views: {
                    'main@main': {templateUrl: '/views/doc_models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Document templates')
                }
            }).state('main.kb_mgmt.analysis_guides', {
                url: '/guides',
                views: {
                    'main@main': {templateUrl: '/views/analysis_guides.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Analysis guide')
                }
            }).state('main.kb_mgmt.analysis_guides.items', {
                url: '/:guideId',
                views: {
                    'main@main': {templateUrl: '/views/items.analysis_guides.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Guide contents')
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
                        var ErrorService = $injector.get('ErrorService');

                        if (response.status == 401) {
                            var $state = $injector.get('$state');
                            $state.transitionTo('login');
                        } else if (response.status == 412) {
                            // Human-readable error, with translation support
                            for (var i = 0; i < response.data.errors.length; ++i) {
                                ErrorService.notifyError(response.data.errors[i].message);
                            }
                        } else if (response.status >= 400 && response.config.url != '/auth') {
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
    run(['ConfigService', 'UserService', 'gettext', 'gettextCatalog', '$rootScope',
        function (ConfigService, UserService, gettext, gettextCatalog, $rootScope) {
            ConfigService.loadConfig(function () {
                var languages = ConfigService.getLanguages();
                var uiLang = UserService.getUiLanguage();

                gettextCatalog.setCurrentLanguage(languages[uiLang].substring(0, 2).toLowerCase());
                $rootScope.updatePaginationLabels();
            });

            // Method to update pagination labels globally when switching language in account settings
            $rootScope.updatePaginationLabels = function () {
                $rootScope.paginationLabels = {
                    page: gettext('Page:'),
                    rowsPerPage: gettext('Rows per page:'),
                    of: gettext('of')
                }
            }

            $rootScope.updatePaginationLabels();
        }
    ]);