angular
    .module('BackofficeApp', ['ngMaterial', 'ui.router', 'gettext', 'ngResource', 'LocalStorageModule', 'md.data.table',
                                'ncy-angular-breadcrumb'])
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
                },
                ncyBreadcrumb: {
                    label: gettext('Login')
                }
            }).state('main', {
                url: "/backoffice",
                views: {
                    "main": {templateUrl: "/views/index.backoffice.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Home')
                }
            }).state('main.admin', {
                url: "/admin",
                views: {
                },
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
                views: {
                    "main": {templateUrl: "/views/index.kb_mgmt.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('KB management')
                }
            }).state('main.kb_mgmt.info_risk', {
                url: '/info',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Information risks')
                }
            }).state('main.kb_mgmt.models', {
                url: '/models',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Models')
                }
            }).state('main.kb_mgmt.op_risk', {
                url: '/op',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/op_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Operational risks')
                }
            }).state('main.kb_mgmt.doc_models', {
                url: '/docs',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/doc_models.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Document models')
                }
            }).state('main.kb_mgmt.analysis_guides', {
                url: '/guides',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/analysis_guides.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Analysis guide')
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
                            $http.defaults.headers.common.token = UserService.getToken();
                        }

                        return config;
                    },

                    'responseError': function (response) {
                        if (response.status == 401) {
                            var $state = $injector.get('$state');
                            $state.transitionTo('login');
                        } else if (response.status >= 400) {
                            var ErrorService = $injector.get('ErrorService');

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

                        return response;
                    }
                }
            }]);
            $httpProvider.interceptors.push('monarcHttpInter');
        }]);