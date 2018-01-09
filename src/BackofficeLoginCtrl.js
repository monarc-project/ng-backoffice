(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficeLoginCtrl', [
            '$scope', '$state', '$http', 'toastr', 'gettextCatalog', 'UserService',
            BackofficeLoginCtrl
        ]);

    /**
     * Login Controller for the Backoffice module
     */
    function BackofficeLoginCtrl($scope, $state, $http, toastr, gettextCatalog, UserService) {
        $scope.isLoggingIn = false;
        $scope.pwForgotMode = false;
        $scope.user = {
            'email': null,
            'password': null
        };

        $scope.passwordForgotten = function () {
            $scope.pwForgotMode = true;
        };

        $scope.passwordForgottenImpl = function () {
            $http.post('api/admin/passwords', {email: $scope.user.email}).then(function (data) {
                toastr.success(gettextCatalog.getString("The password reset request has been sent successfully. You will receive a mail shortly with information on how to reset your account password."));
                $scope.returnToLogin();
            });
        };

        $scope.returnToLogin = function () {
            $scope.pwForgotMode = false;
        };

        $scope.login = function () {
            $scope.isLoggingIn = true;

            UserService.authenticate($scope.user.email, $scope.user.password).then(
                function () {
                    if (UserService.isAllowed('dbadmin')) {
                        $state.transitionTo('main');
                    } else {
                        $state.transitionTo('main.account');
                    }
                },

                function () {
                    $scope.isLoggingIn = false;
                    toastr.warning(gettextCatalog.getString('Your e-mail address or password is invalid, please try again.'));
                }
            );
        }
    }

})();
