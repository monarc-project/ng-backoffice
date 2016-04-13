(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficeMainCtrl', [
            '$scope', '$state', '$mdSidenav', 'gettextCatalog', 'UserService', 'BreadcrumbService',
            BackofficeMainCtrl
        ]);

    /**
     * Main Controller for the Backoffice module
     */
    function BackofficeMainCtrl($scope, $state, $mdSidenav, gettextCatalog, UserService, BreadcrumbService) {
        if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
            setTimeout(function() {
                $state.transitionTo('login');
            }, 1);

            return;
        }

        $scope.sidenavIsOpen = true;
        $scope.isLoggingOut = false;
        $scope.BreadcrumbService = BreadcrumbService;

        BreadcrumbService.setItems(['KB management']);

        // Translations helper
        $scope.setLang = function (lang) {
            gettextCatalog.setCurrentLanguage(lang);
        };

        // Toolbar helpers
        $scope.openToolbarMenu = function($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        $scope.logout = function () {
            $scope.isLoggingOut = true;

            UserService.logout().then(
                function () {
                    $scope.isLoggingOut = false;
                    $state.transitionTo('login');
                },

                function () {
                    // TODO
                    $scope.isLoggingOut = false;
                    console.log("Error while logging out!");
                }
            )
        };

        // Sidenav helpers
        $scope.closeLeftSidenav = function () {
            $scope.sidenavIsOpen = false;
            $mdSidenav('left').close();
        };
        $scope.openLeftSidenav = function () {
            $scope.sidenavIsOpen = true;
            $mdSidenav('left').open();
        };
    }

})();