(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoObjectCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', '$stateParams', 'gettext', 'gettextCatalog', 'ObjlibService',
            BackofficeKbInfoObjectCtrl
        ]);

    /**
     * BO > KB > INFO > Objects Library > Object details
     */
    function BackofficeKbInfoObjectCtrl($scope, $mdToast, $mdMedia, $mdDialog, $stateParams,
                                        gettext, gettextCatalog, ObjlibService) {
        ObjlibService.getObjlib($stateParams.objectId).then(function (object) {
            $scope.object = object;
        });
/*
        $scope.composition = [
            {
                id: 30,
                name1: 'Enfant 1'
            },
            {
                id: 31,
                name1: 'Enfant 2',
                children: [
                    {
                        id: 41,
                        name1: 'Sous-enfant 2-1'
                    }
                ]
            },
            {
                id: 32,
                name1: 'Enfant 3'
            }
        ];*/

        $scope.deleteCompositionItem = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettext('Detach this component?'))
                .textContent(gettext('The selected component will be detached from the current object.'))
                .ariaLabel(gettext('Detach this component'))
                .targetEvent(ev)
                .ok(gettext('Detach'))
                .cancel(gettext('Cancel'));

            $mdDialog.show(confirm).then(function () {
                // Validated
            }, function () {
                // Cancel
            })
        }

        $scope.deleteObject = function (ev) {
            var confirm = $mdDialog.confirm()
                .title(gettext('Delete this object?'))
                .textContent(gettextCatalog.getString('The current object "{{ name }}" will be permanently deleted. Are you sure?',
                    {name: $scope.object.name1}))
                .ariaLabel(gettext('Delete this object'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));

            $mdDialog.show(confirm).then(function () {
                // Validated
            }, function () {
                // Cancel
            })
        }

        $scope.exportObject = function (ev) {
            var prompt = $mdDialog.prompt()
                .title(gettext('Password'))
                .textContent(gettext('Please enter a password to protect your object'))
                .ariaLabel(gettext('Password'))
                .targetEvent(ev)
                .ok(gettext('Export'))
                .cancel(gettext('Cancel'));

            $mdDialog.show(prompt).then(function (result) {
                console.log("Http Call to export with password " + result);
            });
        }

        $scope.createComponent = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ObjlibService', CreateComponentDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.node.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
            })
                .then(function (objlib) {
                    if (objlib) {
                        if (objlib.object) {
                            objlib.object = objlib.object.id;
                        }

                        ObjlibService.createObjlib(objlib,
                            function () {
                                $scope.updateObjlibs();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The object has been created successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    }
                });
        };

        $scope.createNewObjlib = function (ev, objlib) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var isUpdate = (objlib && objlib.id);

            $scope.objLibDialog = $mdDialog;
            $scope.objLibDialog.show({
                controller: ['$scope', '$mdDialog', '$mdToast', 'gettext', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    objLibDialog: $scope,
                    objlib: objlib
                }
            })
                .then(function (objlib) {
                    if (objlib) {
                        if (objlib.asset) {
                            objlib.asset = objlib.asset.id;
                        }

                        if (objlib.rolfTag) {
                            objlib.rolfTag = objlib.rolfTag.id;
                        }

                        if (isUpdate) {
                            ObjlibService.updateObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent(gettext('The object has been updated successfully.'))
                                            .position('top right')
                                            .hideDelay(3000)
                                    );
                                }
                            );
                        } else {
                            ObjlibService.createObjlib(objlib,
                                function () {
                                    $scope.updateObjlibs();
                                    $mdToast.show(
                                        $mdToast.simple()
                                            .textContent(gettext('The object has been created successfully.'))
                                            .position('top right')
                                            .hideDelay(3000)
                                    );
                                }
                            );
                        }
                    }
                });
        };

        $scope.editObjlib = function (ev, objlib) {
            if (objlib && objlib.id) {
                ObjlibService.getObjlib(objlib.id).then(function (objlibData) {
                    $scope.createNewObjlib(ev, objlibData);
                });
            } else {
                $scope.createNewObjlib(ev, objlib);
            }
        };
    }


    function CreateComponentDialogCtrl($scope, $mdDialog, $q, ObjlibService) {
        $scope.implicitPosition = null;

        $scope.component = {
            position: null,
            object: null
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if ($scope.implicitPosition == 1 || $scope.implicitPosition == 2) {
                // -1 ==> At the beginning
                // -2 ==> In the end
                $scope.category.position = -$scope.implicitPosition;
            }

            if ($scope.category.parent) {
                $scope.category.parent = $scope.category.parent.id;
            }

            if ($scope.category.previous) {
                $scope.category.previous = $scope.category.previous.id;
            }

            $mdDialog.hide($scope.category);
        };

        $scope.queryObjectSearch = function (query) {
            var q = $q.defer();

            ObjlibService.getObjlibs({filter: query}).then(function (x) {
                if (x && x.objects) {
                    q.resolve(x.objects);
                } else {
                    q.reject();
                }
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedObjectChange = function (item) {
            $scope.component.object = item;
        };
    }
})();