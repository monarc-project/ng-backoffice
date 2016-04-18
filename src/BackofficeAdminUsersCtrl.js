(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminUsersCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'gettext', 'AdminUsersService',
            'TableHelperService', 'ErrorService',
            BackofficeAdminUsersCtrl
        ]);

    /**
     * Admin Users Controller for the Backoffice module
     */
    function BackofficeAdminUsersCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, gettext,
                                      AdminUsersService, TableHelperService, ErrorService) {
        $scope.users = TableHelperService.build('-firstname', 25, 1, '');

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
                    ErrorService.notifyFetchError(gettext('users'), status);
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
                                    .textContent(gettext('The user has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created user'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.editUser = function (ev, user) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'user', CreateUserDialogCtrl],
                templateUrl: '/views/dialogs/create.users.admin.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'user': user
                }
            })
                .then(function (user) {
                    AdminUsersService.updateUser(user).then(
                        function () {
                            $scope.updateUsers();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The user information has been updated successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created user'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteUser = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete "{{ firstname }} {{ lastname }}"?',
                    {firstname: item.firstname, lastname: item.lastname}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AdminUsersService.deleteUser(item.id).then(
                    function () {
                        $scope.updateUsers();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The user "{{firstname}} {{lastname}}" has been deleted.',
                                    {firstname: item.firstname, lastname: item.lastname}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        ErrorService.notifyFetchError(gettext('deleted user'), status);
                    }
                );
            }, function() {
            });
        };

        $scope.updateUsers();
    }


    function CreateUserDialogCtrl($scope, $mdDialog, user) {
        if (user != undefined && user != null) {
            $scope.user = user;
        } else {
            $scope.user = {
                firstname: '',
                lastname: '',
                email: '',
                phone: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.user);
        };
    }

})();