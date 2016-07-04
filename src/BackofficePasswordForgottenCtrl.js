(function(){

    angular
        .module('BackofficeApp')
        .controller('BackofficePasswordForgottenCtrl', [
            '$scope', '$stateParams', '$state', '$http', 'toastr', 'gettextCatalog', 'gettext', 'UserService',
            BackofficePasswordForgottenCtrl
        ]);

    /**
     * Password Forgotten Controller for the Backoffice module
     */
    function BackofficePasswordForgottenCtrl($scope, $stateParams, $state, $http, toastr, gettextCatalog, gettext, UserService) {
        $scope.isTokenValid = null;
        $scope.user = {
            password: '',
            confirm: ''
        }

        // Check token
        $http.post('/api/admin/passwords', {token: $stateParams.token}).then(function (data) {
            if (data.data.status == false) {
                toastr.error(gettext("Your password reset code is invalid. Please try again."));
                $state.transitionTo('login');
            }
        });

        $scope.resetPassword = function () {
            $http.post('/api/admin/passwords', {token: $stateParams.token, password: $scope.user.password, confirm: $scope.user.confirm}).then(function (data) {
                toastr.success(gettext("Your password has been reset."));
                $state.transitionTo('login');
            });
        }
    }

})();