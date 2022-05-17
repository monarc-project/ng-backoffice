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
            'password': null,
            'otp': null,
            'recoveryCode': null,
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

        $scope.recoveryMode = function () {
            $scope.recoveryCodeMode = true;
            $scope.twoFAMode = false;
        };

        $scope.returnToLogin = function () {
            $scope.pwForgotMode = false;
            $scope.twoFAMode = false;
        };

        $scope.login = function () {
            $scope.isLoggingIn = true;

            UserService.authenticate($scope.user.email, $scope.user.password, $scope.user.otp, $scope.user.recoveryCode).then(
                function () {
                    if (UserService.isAllowed('dbadmin')) {
                        $state.transitionTo('main');
                    } else {
                        $state.transitionTo('main.account');
                    }
                },

                function (revoked) {
                    $scope.isLoggingIn = false;
                    if (revoked == "2FARequired") {
                      $scope.twoFAMode = (revoked == "2FARequired");
                      toastr.warning(gettext('Please enter your Two Factor Authentication token.'));
                    }
                    if (!revoked) {
                        toastr.warning(gettext('Your e-mail address or password is invalid, please try again.'));
                    }
                }
            );
        }
    }

})();
