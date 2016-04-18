(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficeLoginCtrl', [
            '$scope', '$state', '$mdToast', 'gettextCatalog', 'gettext', 'UserService',
            BackofficeLoginCtrl
        ]);

    /**
     * Login Controller for the Backoffice module
     */
    function BackofficeLoginCtrl($scope, $state, $mdToast, gettextCatalog, gettext, UserService) {
        $scope.isLoggingIn = false;
        $scope.user = {
            'email': null,
            'password': null
        };

        $scope.login = function () {
            $scope.isLoggingIn = true;

            UserService.authenticate($scope.user.email, $scope.user.password).then(
                function () {
                    $state.transitionTo('main');
                },

                function () {
                    $scope.isLoggingIn = false;
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent(gettext('Your e-mail address or password is invalid, please try again.'))
                            .position('top right')
                            .hideDelay(4000)
                    );
                }
            );
        }
    }

})();