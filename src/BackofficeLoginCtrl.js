(function(){

  angular
  .module('BackofficeApp')
  .controller('BackofficeLoginCtrl', [
    '$scope', '$state', '$http', 'toastr', 'gettextCatalog', 'gettext', 'UserService',
    BackofficeLoginCtrl
  ]);

  /**
  * Login Controller for the Backoffice module
  */
  function BackofficeLoginCtrl($scope, $state, $http, toastr, gettextCatalog, gettext, UserService) {
    $scope.isLoggingIn = false;
    $scope.pwForgotMode = false;
    $scope.twoFASetUpMode = false;
    $scope.user = {
      'email': null,
      'password': null,
      'otp': null,
      'recoveryCode': null,
      'verificationCode': null,
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
      $scope.twoFASetUpMode = false;
    };

    $scope.returnToLogin = function () {
      $scope.pwForgotMode = false;
      $scope.twoFAMode = false;
      $scope.twoFASetUpMode = false;
      $scope.recoveryCodeMode = false;
      $scope.user.otp = "";
      $scope.user.recoveryCode = "";
    };

    $scope.login = function () {
      $scope.isLoggingIn = true;
      $scope.twoFAMode = false;
      $scope.twoFASetUpMode = false;
      $scope.recoveryCodeMode = false;

      UserService.authenticate($scope.user.email, $scope.user.password, $scope.user.otp, $scope.user.recoveryCode, $scope.user.verificationCode).then(
        function () {
          if (UserService.isAllowed('dbadmin')) {
            $state.transitionTo('main');
          } else {
            $state.transitionTo('main.account');
          }
        },

        function (revoked) {
          $scope.isLoggingIn = false;
          $scope.twoFAMode = revoked.includes("2FARequired");
          $scope.twoFASetUpMode = revoked.includes("2FAToBeConfigured:");
          if ($scope.twoFAMode) {
            toastr.warning(gettext('Please enter your two-factor authentication token.'));
          }
          else if ($scope.twoFASetUpMode) {
            toastr.warning(gettext('Please configure two-factor authentication.'));
            $scope.user.qrcode = revoked.split(":", 3).slice(1).join(":");
          }
          if (!revoked) {
            $scope.user.otp = "";
            $scope.user.recoveryCode = "";
            toastr.warning(gettext('Your e-mail address or password is invalid, please try again.'));
          }
        }
      );
    }
  }

})();
