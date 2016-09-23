(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoObjectCtrl', [
            '$scope', '$rootScope', '$timeout', '$state', 'toastr', '$mdMedia', '$mdDialog', '$stateParams', '$http', 'gettextCatalog',
            'ObjlibService', 'DownloadService', 'AnrService',
            BackofficeKbInfoObjectCtrl
        ]);

    /**
     * BO > KB > INFO > Objects Library > Object details
     */
    function BackofficeKbInfoObjectCtrl($scope, $rootScope, $timeout, $state, toastr, $mdMedia, $mdDialog, $stateParams, $http,
                                        gettextCatalog, ObjlibService, DownloadService, AnrService) {

        if ($state.current.name == 'main.kb_mgmt.models.details.object') {
            $scope.mode = 'anr';

            $scope.openRiskSheet = function (risk) {
                $scope.sheet_risk = risk;
            };

            $scope.resetSheet = function () {
                $scope.sheet_risk = undefined;
            };
        } else {
            $scope.mode = 'bdc';
        }

        $rootScope.anr_selected_instance_id = null;
        $rootScope.anr_selected_object_id = $stateParams.objectId;

        var isObjectLoading = true;

        $scope.$watch('object.risks', function (newValue, oldValue) {
            if (!isObjectLoading) {
                for (var i = 0; i < newValue.length; ++i) {
                    var newItem = newValue[i];
                    var oldItem = oldValue[i];

                    if (!angular.equals(newItem, oldItem)) {
                        // This risk changed, update it
                        ObjlibService.updateRisk(newItem.id, newItem);
                    }
                }

                // Update the whole table
                $timeout($scope.updateObjlib, 500);
            }
        }, true);


        $scope.updateObjlib = function () {
            isObjectLoading = true;
            ObjlibService.getObjlib($stateParams.objectId, {mode: $scope.mode}).then(function (object) {
                $scope.object = object;
                $scope.composition = object.children;
                $timeout(function() { isObjectLoading = false; });
            });
        };

        $scope.updateObjlib();


        $scope.deleteCompositionItem = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Detach this component?'))
                .textContent(gettextCatalog.getString('The selected component will be detached from the current object.'))
                .ariaLabel(gettextCatalog.getString('Detach this component'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Detach'))
                .cancel(gettextCatalog.getString('Cancel'));

            $mdDialog.show(confirm).then(function () {
                ObjlibService.deleteObjlibNode(item.component_link_id, function () {
                    $scope.updateObjlib();
                    toastr.success(gettextCatalog.getString('The object has been detached successfully'), gettextCatalog.getString('Component detached'));
                });
            }, function () {
                // Cancel
            })
        }

        $scope.deleteObject = function (ev) {
            if ($scope.mode == 'bdc') {
                var confirm = $mdDialog.confirm()
                    .title(gettextCatalog.getString('Delete this object?'))
                    .textContent(gettextCatalog.getString('The current object "{{ name }}" will be permanently deleted. Are you sure?',
                        {name: $scope.object.name1}))
                    .ariaLabel(gettextCatalog.getString('Delete this object'))
                    .targetEvent(ev)
                    .ok(gettextCatalog.getString('Delete'))
                    .cancel(gettextCatalog.getString('Cancel'));

                $mdDialog.show(confirm).then(function () {
                    ObjlibService.deleteObjlib($scope.object.id, function () {
                        $state.transitionTo('main.kb_mgmt.info_risk', {'tab': 'objlibs'});
                    });
                }, function () {
                    // Cancel
                })
            } else if ($scope.mode == 'anr') {
                var confirm = $mdDialog.confirm()
                    .title(gettextCatalog.getString('Detach this object?'))
                    .textContent(gettextCatalog.getString('The current object "{{ name }}" will be removed from the library. Are you sure?',
                        {name: $scope.object.name1}))
                    .ariaLabel(gettextCatalog.getString('Detach this object'))
                    .targetEvent(ev)
                    .ok(gettextCatalog.getString('Detach'))
                    .cancel(gettextCatalog.getString('Cancel'));

                $mdDialog.show(confirm).then(function () {
                    AnrService.removeObjectFromLibrary($rootScope.anr_id, $scope.object.id, function () {
                        toastr.success(gettextCatalog.getString('The object has been detached from the library.'));
                    });
                }, function () {
                    // Cancel
                })
            }
        }

        $scope.createNewObjlib = function (ev, objlib) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var isUpdate = (objlib && objlib.id);

            $scope.objLibDialog = $mdDialog;
            $scope.objLibDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'mode', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    mode: $scope.mode,
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

                        if (objlib.category) {
                            objlib.category = objlib.category.id;
                        }

                        if (isUpdate) {
                            ObjlibService.updateObjlib(objlib,
                                function () {
                                    $scope.updateObjlib();

                                    // If we're in an ANR, we might want to know when an object has been updated to
                                    // update labels in the trees
                                    if ($rootScope.hookUpdateObjlib) {
                                        $rootScope.hookUpdateObjlib();
                                    }

                                    toastr.success(gettextCatalog.getString('The object has been updated successfully.'), gettextCatalog.getString('Update successful'));
                                }
                            );
                        } else {
                            ObjlibService.createObjlib(objlib,
                                function () {
                                    $scope.updateObjlib();
                                    toastr.success(gettextCatalog.getString('The object has been created successfully.'), gettextCatalog.getString('Creation successful'));
                                }
                            );
                        }
                    }
                });
        };

        $scope.editObjlib = function (ev, objlib, dontFetch) {
            if (objlib && objlib.id) {
                if (dontFetch) {
                    $scope.createNewObjlib(ev, objlib);
                } else {
                    ObjlibService.getObjlib(objlib.id).then(function (objlibData) {
                        $scope.createNewObjlib(ev, objlibData);
                    });
                }
            } else {
                $scope.createNewObjlib(ev, objlib);
            }
        };

        $scope.exportObject = function (ev) {
            var prompt = $mdDialog.prompt()
                .title(gettextCatalog.getString('Password'))
                .textContent(gettextCatalog.getString('Please enter a password to protect your object'))
                .ariaLabel(gettextCatalog.getString('Password'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Export'))
                .cancel(gettextCatalog.getString('Cancel'));

            $mdDialog.show(prompt).then(function (result) {
                $http.post('/api/objects-export', {id: $scope.object.id, password: result}).then(function (data) {
                    DownloadService.downloadBlob(data.data, 'object.bin');
                    toastr.success(gettextCatalog.getString('The object has been exported successfully.'), gettextCatalog.getString('Export successful'));
                })
            });
        };

        $scope.cloneObject = function (ev) {
            $http.post("/api/objects-duplication", {id: $scope.object.id, implicitPosition: 2}).then(function (data) {
                toastr.success(gettextCatalog.getString('Ths object has been duplicated successfully.'), gettextCatalog.getString('Duplication successful'));
            });
        };

        $scope.createComponent = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ObjlibService', 'myself', CreateComponentDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.node.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'myself': $scope.object
                }
            })
                .then(function (objlib) {
                    if (objlib) {
                        objlib.father = $scope.object.id;

                        ObjlibService.createObjlibNode(objlib,
                            function () {
                                $scope.updateObjlib();
                                toastr.success(gettextCatalog.getString('The component has been created successfully.'), gettextCatalog.getString('Creation successful'));
                            }
                        );
                    }
                });
        };

        $scope.moveComponent = function (item, direction) {
            ObjlibService.moveObjlibNode({id: item.component_link_id, move: direction}, function (data) {
                $scope.updateObjlib();
            })
        };
    }


    function CreateComponentDialogCtrl($scope, $mdDialog, $q, ObjlibService, myself) {
        $scope.component = {
            position: null,
            child: null,
            implicitPosition: 1
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if ($scope.component.child) {
                $scope.component.child = $scope.component.child.id;
            }

            if ($scope.component.previous) {
                $scope.component.previous = $scope.component.previous.component_link_id;
            }

            $mdDialog.hide($scope.component);
        };

        $scope.queryObjectSearch = function (query) {
            var q = $q.defer();

            ObjlibService.getObjlibs({filter: query, order: 'label1'}).then(function (x) {
                if (x && x.objects) {
                    var objects_filtered = [];

                    for (var i = 0; i < x.objects.length; ++i) {
                        if (x.objects[i].id != myself.id) {
                            objects_filtered.push(x.objects[i]);
                        }
                    }

                    q.resolve(objects_filtered);
                } else {
                    q.reject();
                }
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedObjectChange = function (item) {
            $scope.component.child = item;
        };

        $scope.queryComponentSearch = function (query) {
            if (query != '' && query != null) {
                var output = [];

                for (var i = 0; i < myself.children.length; i++) {
                    var child = myself.children[i];
                    if (child.name1.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
                        output.push(child);
                    }
                }

                return output;
            } else {
                return myself.children;
            }
        };

        $scope.selectedObjectChange = function (item) {
            $scope.component.child = item;
        };
    }
})();
