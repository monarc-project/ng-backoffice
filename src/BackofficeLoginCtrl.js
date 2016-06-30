(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficeLoginCtrl', [
            '$scope', '$state', 'toastr', 'gettextCatalog', 'gettext', 'UserService',
            BackofficeLoginCtrl
        ]);

    /**
     * Login Controller for the Backoffice module
     */
    function BackofficeLoginCtrl($scope, $state, toastr, gettextCatalog, gettext, UserService) {
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
                    toastr.warning(gettext('Your e-mail address or password is invalid, please try again.'));
                }
            );
        }
    }

})();