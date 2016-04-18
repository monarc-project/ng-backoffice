angular
    .module('BackofficeApp', ['ngMaterial', 'ui.router', 'gettext', 'ngResource', 'LocalStorageModule', 'md.data.table',
                                'ncy-angular-breadcrumb'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('amber');

            $urlRouterProvider.otherwise('/');

            localStorageServiceProvider
                .setStorageType('sessionStorage');

            $breadcrumbProvider.setOptions({
                template: '<div><span ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract"><a ng-switch-when="false" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a><span ng-switch-when="false"> &gt; </span><span ng-switch-when="true">{{step.ncyBreadcrumbLabel}}</span></span></div>'
            });

            $stateProvider.state('login', {
                url: "/",
                views: {
                    "main": {templateUrl: "/views/login.html"}
                },
                ncyBreadcrumb: {
                    label: 'Login'
                }
            }).state('main', {
                url: "/backoffice",
                views: {
                    "main": {templateUrl: "/views/index.backoffice.html"}
                },
                ncyBreadcrumb: {
                    label: 'Home'
                }
            }).state('main.admin', {
                url: "/admin",
                views: {
                },
                ncyBreadcrumb: {
                    label: 'Administration'
                }
            }).state('main.admin.users', {
                url: "/users",
                views: {
                    "main@main": {templateUrl: "/views/users.admin.html"}
                },
                ncyBreadcrumb: {
                    label: 'Users management'
                }
            }).state('main.admin.servers', {
                url: "/servers",
                views: {
                    "main@main": {templateUrl: "/views/servers.admin.html"}
                },
                ncyBreadcrumb: {
                    label: 'Servers management'
                }
            }).state('main.kb_mgmt', {
                url: "/kb",
                views: {
                    "main": {templateUrl: "/views/index.kb_mgmt.html"}
                },
                ncyBreadcrumb: {
                    label: 'KB management'
                }
            }).state('main.kb_mgmt.info_risk', {
                url: '/info',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/info_risk.kb_mgmt.html'}
                },
                controller: function ($scope) {
                },
                ncyBreadcrumb: {
                    label: 'Information risks'
                }
            }).state('main.kb_mgmt.op_risk', {
                url: '/op',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/op_risk.kb_mgmt.html'}
                },
                controller: function ($scope) {
                },
                ncyBreadcrumb: {
                    label: 'Operational risks'
                }
            }).state('main.kb_mgmt.doc_models', {
                url: '/docs',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/doc_models.kb_mgmt.html'}
                },
                controller: function ($scope) {
                },
                ncyBreadcrumb: {
                    label: 'Document models'
                }
            }).state('main.kb_mgmt.analysis_guides', {
                url: '/guides',
                views: {
                    'kb_main@main.kb_mgmt': {templateUrl: '/views/analysis_guides.kb_mgmt.html'}
                },
                controller: function ($scope) {
                },
                ncyBreadcrumb: {
                    label: 'Analysis guide'
                }
            });

            // TODO: This is not minimifiable
            /*$httpProvider.interceptors.push(function ($state, UserService) {
                return {
                    'request': function (config) {
                        if (UserService.isAuthenticated()) {
                            config.headers.common.Authorization = 'Bearer ' + UserService.getToken();
                        }
                    },

                    'response': function (response) {
                        if (response.status == 401) {
                            $state.transitionTo('login');
                        }
                    }
                }
            });*/
        }]);