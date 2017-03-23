(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminUsersCtrl', [
            '$scope', '$state', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'AdminUsersService',
            'TableHelperService', 'UserService',
            BackofficeAdminUsersCtrl
        ]);

    /**
     * Admin Users Controller for the Backoffice module
     */
    function BackofficeAdminUsersCtrl($scope, $state, toastr, $mdMedia, $mdDialog, gettextCatalog, AdminUsersService,
                                      TableHelperService, UserService) {

        $scope.myself = UserService.getUserId();

        $scope.users = TableHelperService.build('-firstname', 25, 1, '');
        $scope.users.activeFilter = 1;
        var initUsersFilter = true;
        $scope.$watch('users.activeFilter', function() {
            if (initUsersFilter) {
                initUsersFilter = false;
            } else {
                $scope.updateUsers();
            }
        });



        $scope.removeFilter = function () {
            TableHelperService.removeFilter($scope.users);
        };

        $scope.updateUsers = function () {
            var query = angular.copy($scope.users.query);
            query.status = $scope.users.activeFilter;

            $scope.users.promise = AdminUsersService.getUsers(query);
            $scope.users.promise.then(
                function (data) {
                    $scope.users.items = data;
                }
            );
        };

        TableHelperService.watchSearch($scope, 'users.query.filter', $scope.users.query, $scope.updateUsers);

        $scope.toggleUserStatus = function (user) {
            AdminUsersService.patchUser(user.id, {status: !user.status}, function () {
                user.status = !user.status;
            });
        }

        $scope.createNewUser = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateUserDialogCtrl],
                templateUrl: '/views/dialogs/create.users.admin.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (user) {
                    AdminUsersService.createUser(user,
                        function () {
                            $scope.updateUsers();
                            toastr.success(gettextCatalog.getString('The user has been created successfully.',
                                {firstname: user.firstname, lastname: user.lastname}), gettextCatalog.getString('Creation successful'));
                        });
                });
        };

        $scope.editUser = function (ev, user) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            AdminUsersService.getUser(user.id).then(function (userData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'user', CreateUserDialogCtrl],
                    templateUrl: '/views/dialogs/create.users.admin.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'user': userData
                    }
                })
                    .then(function (user) {
                        AdminUsersService.patchUser(user.id, user,
                            function () {
                                $scope.updateUsers();
                                toastr.success(gettextCatalog.getString('The user has been edited successfully.',
                                    {firstname: user.firstname, lastname: user.lastname}), gettextCatalog.getString('Edition successful'));
                            }
                        );
                    });
            });
        };

        $scope.deleteUser = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete user?',
                    {firstname: item.firstname, lastname: item.lastname}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AdminUsersService.deleteUser(item.id,
                    function () {
                        $scope.updateUsers();
                        toastr.success(gettextCatalog.getString('The user has been deleted.',
                                    {firstname: item.firstname, lastname: item.lastname}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };
    }


    function CreateUserDialogCtrl($scope, $mdDialog, user) {
        if (user != undefined && user != null) {
            $scope.user = user;
            // Ensure password isn't set, otherwise it will be erased with the encrypted value, and is going to be
            // encrypted again.
            $scope.user.password = undefined;
        } else {
            $scope.user = {
                firstname: '',
                lastname: '',
                email: '',
                phone: '',
                role: []
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
