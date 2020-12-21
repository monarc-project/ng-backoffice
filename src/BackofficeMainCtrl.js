(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficeMainCtrl', [
            '$scope', '$rootScope', '$state', '$mdSidenav', '$mdMedia', 'gettextCatalog', 'UserService',
            'UserProfileService',
            BackofficeMainCtrl
        ]);

    /**
     * Main Controller for the Backoffice module
     */
    function BackofficeMainCtrl($scope, $rootScope, $state, $mdSidenav, $mdMedia, gettextCatalog, UserService,
                                UserProfileService) {
        if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
            setTimeout(function() {
                $state.transitionTo('login');
            }, 1);

            return;
        }

        $scope.changeLanguage = function (lang_id) {
          UserService.setUiLanguage(lang_id);
          UserProfileService.updateProfile({language:lang_id},function(){});
          gettextCatalog.setCurrentLanguage($rootScope.languages[lang_id].code);
          $rootScope.uiLanguage = $rootScope.languages[lang_id].flag;
          $scope.updatePaginationLabels();
        }

        $rootScope.isAllowed = UserService.isAllowed;

        $scope.sidenavIsOpen = $mdMedia('gt-md');
        $scope.isLoggingOut = false;

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
            if ($mdMedia('gt-md')) {
                $scope.sidenavIsOpen = true;
            }
            $mdSidenav('left').open();
        };
    }

})();