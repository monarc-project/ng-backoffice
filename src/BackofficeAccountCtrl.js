(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', '$mdMedia', '$mdDialog', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, $mdMedia, $mdDialog, gettextCatalog, toastr, $http, UserService, UserProfileService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                };
            });
        };

        $scope.updateProfile = function () {
            UserProfileService.updateProfile($scope.user, function () {
                toastr.success(gettextCatalog.getString('Your profile has been updated successfully'), gettextCatalog.getString('Profile updated'));
            });
        }

        $scope.updatePassword = function () {
            $http.put('api/user/password/' + UserService.getUserId(), $scope.password).then(function (data) {
                if (data.data.status == 'ok') {
                    toastr.success(gettextCatalog.getString('Your password has been updated successfully'));
                }
            })
        }

        $scope.activateAuthenticatorApp = function (ev) {

          $mdDialog.show({
              controller: ['$scope', '$mdDialog', 'toastr', '$http', 'user', activate2FADialogCtrl],
              templateUrl: 'views/dialogs/activate.2FA.html',
              targetEvent: ev,
              preserveScope: true,
              scope: $scope,
              clickOutsideToClose: false,
              fullscreen: false,
              locals: {
                user : UserService.getUserId()
              }
          })
              .then(function (user) {
                let params = {
                  headers : {
                    'Content-Type' : 'application/json',
                    'Accept' : 'application/json'
                  }
                };

                let data = {
                  'verificationCode': user.verificationCode,
                  'secretKey': user.secretKey
                }

                $http.post('api/user/activate2FA/' + UserService.getUserId(), data, params)
                  .then(function(result){
                    $scope.user.isTwoFactorAuthEnabled = true;
                    toastr.success(gettextCatalog.getString('Two-factor authentication is now activated.'), gettextCatalog.getString('Two-factor authentication'));
                }, function(error){
                  toastr.error(error.data.message, gettextCatalog.getString('Error when enabling two-factor authentication.'));
                });

              }, function (reject) {
                $scope.handleRejectionDialog(reject);
              });
        };

        $scope.deactivateAuthenticatorApp = function (ev) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Disabling two-factor authentication'))
                .textContent(gettextCatalog.getString('Are you sure you want to disable two-factor authentication?'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Disable'))
                .theme('light')
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
              $http.delete('api/user/activate2FA/' + UserService.getUserId())
                .then(function(result){
                  $scope.user.isTwoFactorAuthEnabled = false;
                  toastr.success(gettextCatalog.getString('Two-factor authentication is now deactivated.'), gettextCatalog.getString('Two-factor authentication'));
              }, function(error){
                toastr.error(error.data.message, gettextCatalog.getString('Error when deactivating two-factor authentication.'));
              });
            }, function (reject) {
              $scope.handleRejectionDialog(reject);
            });
        };


        $scope.generateRecoveryCodes = function (ev) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('New recovery codes'))
                .textContent(gettextCatalog.getString('Are you sure you want to generate new recovery codes ?'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('OK'))
                .theme('light')
                .cancel(gettextCatalog.getString('Cancel'));

            $mdDialog.show(confirm).then(function() {

              let params = {
                headers : {
                  'Accept' : 'application/json'
                },
                params :{
                }
              };

              $http.post('api/user/recoveryCodes/' + UserService.getUserId(), params).then(function (data) {
                  $scope.user.remainingRecoveryCodes = data.data.recoveryCodes.length;


                  $mdDialog.show({
                      controller: ['$scope', '$mdDialog', 'toastr', '$http', 'user', 'recoveryCodes', displayRecoveryCodesDialogCtrl],
                      templateUrl: 'views/dialogs/display.recoverycodes.html',
                      targetEvent: ev,
                      preserveScope: true,
                      scope: $scope,
                      clickOutsideToClose: false,
                      fullscreen: false,
                      locals: {
                        user : $scope.user,
                        recoveryCodes: data.data.recoveryCodes,
                      }
                  })
                  .then(function (result) {

                  }, function (reject) {
                    $scope.handleRejectionDialog(reject);
                  });

              }, function(error){
                console.log(error);
              });

            }, function (reject) {
              $scope.handleRejectionDialog(reject);
            });
        };


    function activate2FADialogCtrl($scope, $mdDialog, toastr, $http, user, gettextCatalog) {

      $scope.user = {
          secretKeyQrCode: '',
          secretKey: '',
          verificationCode: '',
          isTwoFactorAuthEnabled: $scope.user.isTwoFactorAuthEnabled,
      };

      let params = {
        headers : {
          'Accept' : 'application/json'
        },
        params :{
        }
      };

      $http.get('api/user/activate2FA/' + user, params).then(function (data) {
          $scope.user.secretKeyQrCode = data.data.qrcode;
          $scope.user.secretKey = data.data.secret;
          $scope.user.verificationCode = $scope.user.verificationCode;
      }, function(error){
        console.log(error);
      });

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.create = function() {
        $mdDialog.hide($scope.user);
      };
    }


    }
})();
