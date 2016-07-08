(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams',
            BackofficeKbModelsDetailsCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS (ANR)
     */
    function BackofficeKbModelsDetailsCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams) {
        ModelService.getModel($stateParams.modelId).then(function (data) {
            $scope.model = data;
        });

        /**
         * Risk analysis
         */
        $scope.anr_obj_instances_data = [
            {
                'id': '__root__', 'label1': 'My Risk Analysis', __children__: [
                {'id': 1, 'label1': 'Object Instance 1', 'ObjectId': 8, __children__: []},
                {'id': 2, 'label1': 'Object Instance 2', 'ObjectId': 8, __children__: []},
            ]
            }
        ];
        $scope.my_tree = {};

        $scope.expanding_property = {
            field: 'label1'
        };

        $scope.col_defs = [
            {field: 'label1'}
        ];

        $scope.callbacks = {
            beforeDrag: function (scopeDrag) {
                return !(scopeDrag.node.id === '__root__');
            },

            accept: function (scopeDrag, scopeTarget, align) {
                return scopeTarget.parent != null;
            }
        };

        $scope.anr_obj_library_data = [];


        $scope.updateObjectsLibrary = function () {
            $scope.anr_obj_library_data = [];

            var categoriesIds = {};

            ObjlibService.getObjlibsCats({limit: 0}).then(function (data) {
                var recurseAddCategories = function (category) {
                    var output = {id: category.id, label1: category.label1, __children__: []};
                    categoriesIds[category.id] = output;

                    if (category.child.length > 0) {
                        for (var i = 0; i < category.child.length; ++i) {
                            output.__children__.push(recurseAddCategories(category.child[i]))
                        }
                    }

                    return output;
                };

                for (var v = 0; v < data.categories.length; ++v) {
                    var cat = data.categories[v];
                    $scope.anr_obj_library_data.push(recurseAddCategories(cat));
                }

                ObjlibService.getObjlibs({limit: 0}).then(function (data) {
                    for (var i = 0; i < data.objects.length; ++i) {
                        var obj = data.objects[i];
                        categoriesIds[obj.category.id].__children__.push(obj);
                    }
                });
            });

        };
        $scope.updateObjectsLibrary();


        /**
         * Evaluation scales
         */
        $scope.range = function (min, max) {
            var array = [];
            for (var v = min; v <= max; ++v) {
                array.push(v);
            }

            return array;
        };

        $scope.inlineNumberValidator = function (val) {
            return (parseInt(val) == val);
        };

        $scope.updateInfoRiskColumns = function () {
            var header = [];
            for (var t = $scope.scales.threats.min; t <= $scope.scales.threats.max; ++t) {
                for (var v = $scope.scales.vulns.min; v <= $scope.scales.vulns.max; ++v) {
                    var prod = t * v;
                    if (header.indexOf(prod) < 0) {
                        header.push(prod);
                    }
                }
            }

            $scope.info_risk_columns = header.sort(function (a, b) {
                return parseInt(a) - parseInt(b);
            });
        };

        $scope.scales = {
            impacts: {min: '0', max: '3'},
            threats: {min: '0', max: '4'},
            vulns: {min: '0', max: '3'},
            thresholds: {min: 8, max: 32},
            rolf_thresholds: {min: 4, max: 8}
        }

        $scope.info_risk_columns = [];
        $scope.info_risk_rows = [];

        $scope.$watch('scales', function () {
            $scope.updateInfoRiskColumns();
            $scope.info_risk_rows = $scope.range($scope.scales.impacts.min, $scope.scales.impacts.max);
        }, true);


        $scope.editAnrInfo = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateAnrDialogCtrl],
                templateUrl: '/views/dialogs/create.anr.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
            })
                .then(function (objlib) {
                    if (objlib) {
                        ObjlibService.createObjlibNode(objlib,
                            function () {
                                $scope.updateObjlib();
                                toastr.success(gettext('The component has been created successfully.'), gettext('Creation successful'));
                            }
                        );
                    }
                });
        };

        $scope.addObject = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ObjlibService', 'ModelService', 'model_id', AddObjectDialogCtrl],
                templateUrl: '/views/dialogs/add.objlib.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    model_id: $scope.model.id
                }
            })
                .then(function (objlib) {
                    if (objlib && objlib.id) {
                        ModelService.addExistingObject($scope.model.id, objlib.id);
                    }
                });
        };

    }

    function CreateAnrDialogCtrl($scope, $mdDialog, anr) {
        if (anr != undefined && anr != null) {
            $scope.anr = anr;
        } else {
            $scope.anr = {
                name: '',
                description: ''
            };
        }

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            $mdDialog.hide($scope.category);
        };
    }

    function AddObjectDialogCtrl($scope, $mdDialog, $q, ObjlibService, ModelService, model_id) {
        $scope.createAttachedObject = function () {
            $scope.objLibDialog = $mdDialog;
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                clickOutsideToClose: true,
                locals: {
                    objLibDialog: $scope,
                    objlib: null
                }
            }).then(function (objlib) {
                if (objlib) {
                    if (objlib.category) {
                        objlib.category = objlib.category.id;
                    }
                    if (objlib.asset) {
                        objlib.asset = objlib.asset.id;
                    }
                    if (objlib.rolfTag) {
                        objlib.rolfTag = objlib.rolfTag.id;
                    }
                    
                    ModelService.addNewObject(model_id, objlib);
                }
            });
        };

        $scope.queryCategorySearch = function (query) {
            var q = $q.defer();

            ObjlibService.getObjlibsCats({filter: query}).then(function (x) {
                if (x && x.categories) {
                    // Recursively build items
                    var buildItemRecurse = function (children, depth) {
                        var output = [];

                        for (var i = 0; i < children.length; ++i) {
                            var child = children[i];

                            for (var j = 0; j < depth; ++j) {
                                child.label1 = " >> " + child.label1;
                            }

                            output.push(child);

                            if (child.child.length > 0) {
                                var child_output = buildItemRecurse(child.child, depth + 1);
                                output = output.concat(child_output);
                            }
                        }

                        return output;
                    };

                    q.resolve(buildItemRecurse(x.categories, 0));
                } else {
                    q.reject();
                }
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.queryObjectSearch = function (query) {
            var q = $q.defer();

            ObjlibService.getObjlibs({
                filter: query,
                category: $scope.objlib.category.id,
                lock: true
            }).then(function (x) {
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

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            $mdDialog.hide($scope.object);
        };
    }

    /////////////////////////////////////////////////////////

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsSubtreeCtrl', [
            '$scope',
            BackofficeKbModelsDetailsSubtreeCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > SUBTREE WORKAROUND
     */
    function BackofficeKbModelsDetailsSubtreeCtrl($scope) {
        var self = this;

        self.draggedFromHere = false;

        $scope.callbacks = {
            beforeDrag: function (scopeDrag) {
                self.draggedFromHere = true;
                return !(scopeDrag.node.id === '__root__');
            },

            accept: function (scopeDrag, scopeTarget, align) {
                return scopeTarget.parent != null && !self.draggedFromHere;
            },

            beforeDrop: function (event) {
                self.draggedFromHere = false;
                return true;
            }

        };
    }

})();