(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminUsersCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'AdminUsersService', 'TableHelperService',
            BackofficeAdminUsersCtrl
        ]);

    /**
     * Admin Users Controller for the Backoffice module
     */
    function BackofficeAdminUsersCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, AdminUsersService,
                                      TableHelperService) {
        var showErrorToast = function (thing, status) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('An error occurred while fetching ' + thing + ': ' + status)
                    .position('top right')
                    .hideDelay(3000)
            );
        };

        $scope.users = TableHelperService.build('firstname', 25, 1, '');

        $scope.removeFilter = function () {
            TableHelperService.removeFilter($scope.users);
        };

        $scope.updateUsers = function () {
            $scope.users.promise = AdminUsersService.getUsers($scope.users.query);
            $scope.users.promise.then(
                function (data) {
                    $scope.users.items = data;
                },

                function (status) {
                    showErrorToast('users', status);
                }
            );
        };

        TableHelperService.watchSearch($scope, 'users.query.filter', $scope.users.query, $scope.updateUsers);

        $scope.createNewUser = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateUserDialogCtrl],
                templateUrl: '/views/dialogs/create.users.admin.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (user) {
                    AdminUsersService.createUser(user).then(
                        function () {
                            $scope.updateUsers();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('The user has been created successfully.')
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            showErrorToast('created user', status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteUser = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to delete "' + item.firstname + " " + item.lastname + '"?')
                .textContent('This operation is irreversible.')
                .targetEvent(ev)
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                AdminUsersService.deleteUser(item.id).then(
                    function () {
                        $scope.updateUsers();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('The user "' + item.firstname + " " + item.lastname + '" has been deleted.')
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        showErrorToast('deleted user', status);
                    }
                );
            }, function() {
            });
        };

        $scope.updateUsers();
    }


    function CreateUserDialogCtrl($scope, $mdDialog) {
        $scope.user = {
            firstname: '',
            lastname: '',
            email: '',
            phone: ''
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.user);
        };
    }

})();