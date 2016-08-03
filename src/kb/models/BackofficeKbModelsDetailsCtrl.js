(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', 'AnrService', '$stateParams',
            BackofficeKbModelsDetailsCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS (ANR)
     */
    function BackofficeKbModelsDetailsCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, AnrService, $stateParams) {
        var self = this;

        ModelService.getModel($stateParams.modelId).then(function (data) {
            $scope.model = data; $scope.updateInstances();
            $scope.updateObjectsLibrary();
            $scope.updateScalesComments();
        });

        /**
         * Risk analysis
         */
        // Tree
        $scope.anr_obj_instances_data = [];
        $scope.anr_obj_library_data = [];

        $scope.toggle = function (scope) {
            scope.toggle();
        }

        $scope.libTreeCallbacks = {

            dropped: function (e) {
                // Make a copy of the item from the library tree to the inst tree
                var copy = angular.copy(e.source.nodeScope.$modelValue);
                e.source.nodesScope.$modelValue.push(copy);
            }
        }


        $scope.updateObjectsLibrary = function () {
            $scope.anr_obj_library_data = [];

            AnrService.getObjectsLibrary($scope.model.anr.id).then(function (data) {
                var recurseFillTree = function (category) {
                    var output = {id: category.id, type: 'libcat', label1: category.label1, __children__: []};

                    if (category.child && category.child.length > 0) {
                        for (var i = 0; i < category.child.length; ++i) {
                            output.__children__.push(recurseFillTree(category.child[i]));
                        }
                    }

                    if (category.objects && category.objects.length > 0) {
                        for (var i = 0; i < category.objects.length; ++i) {
                            var obj = category.objects[i];
                            obj.type = 'lib';
                            output.__children__.push(obj);
                        }
                    }

                    return output;
                };

                for (var v = 0; v < data.categories.length; ++v) {
                    var cat = data.categories[v];
                    $scope.anr_obj_library_data.push(recurseFillTree(cat));
                }
            });
        };

        $scope.updateInstances = function () {
            AnrService.getInstances($scope.model.anr.id).then(function (data) {
                $scope.anr_obj_instances_data = [];

                var recurseFillTree = function (instance) {
                    var output = {id: instance.id, type: 'inst', label1: instance.label1, __children__: []};

                    if (instance.child && instance.child.length > 0) {
                        for (var i = 0; i < instance.child.length; ++i) {
                            output.__children__.push(recurseFillTree(instance.child[i]));
                        }
                    }

                    if (instance.objects && instance.objects.length > 0) {
                        for (var i = 0; i < instance.objects.length; ++i) {
                            output.__children__.push(instance.objects[i]);
                        }
                    }

                    return output;
                };

                for (var v = 0; v < data.instances.length; ++v) {
                    var instance = data.instances[v];
                    $scope.anr_obj_library_data.push(recurseFillTree(instance));
                }
            });



        };


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

        $scope.thresholds = {
            thresholds: {min: 8, max: 32},
            rolf_thresholds: {min: 4, max: 8}
        }

        $scope.scales = {
            impacts: {min: '0', max: '3'},
            threats: {min: '0', max: '4'},
            vulns: {min: '0', max: '3'},
        }

        $scope.info_risk_columns = [];
        $scope.info_risk_rows = [];

        var scaleWatchSetup = false;
        var commsWatchSetup = false;

        $scope.$watch('thresholds', function () {
            if ($scope.model && $scope.model.anr && scaleWatchSetup) {
                // This structure holds (ROLF) thresholds, as well as scales ranges
                AnrService.patchAnr($scope.model.anr.id, {
                    seuil1: $scope.thresholds.thresholds.min,
                    seuil2: $scope.thresholds.thresholds.max,
                    seuil_rolf1: $scope.thresholds.rolf_thresholds.min,
                    seuil_rolf2: $scope.thresholds.rolf_thresholds.max,
                });
            }

            $scope.updateInfoRiskColumns();
            $scope.info_risk_rows = $scope.range($scope.scales.impacts.min, $scope.scales.impacts.max);
            scaleWatchSetup = true;
        }, true);

        $scope.$watchGroup(['threat', 'impact', 'vuln'], function (newValue, oldValue) {
            if (commsWatchSetup) {
                console.log(newValue);
            }

            commsWatchSetup = true;
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
                        AnrService.addExistingObjectToLibrary($scope.model.anr.id, objlib.id, function () {
                            $scope.updateObjectsLibrary();
                        });
                    }
                });
        };

        $scope.updateScalesComments = function () {
            AnrService.getScales($scope.model.anr.id).then(function (data) {
                $scope.anr_scales = data;

                for (var i = 0; i < data.scales.length; ++i) {
                    var scale = data.scales[i];

                    var obj = {};
                    for (var j = scale.min; j < scale.max; j++) {
                        obj[j] = null;
                    }


                    if (scale.type == "impact") {
                        $scope.impact = obj;
                    } else if (scale.type == "threat") {
                        $scope.threat = obj;
                    } else if (scale.type == "vulnerability") {
                        $scope.vuln = obj;
                    }
                }

                AnrService.getScaleComments($scope.model.anr.id).then(function (data) {
                    console.log(data);
                })
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
        $scope.objectSearchText = '';
        $scope.categorySearchText = '';

        $scope.objlib = {
            category: null,
            object: null
        };

        $scope.createAttachedObject = function () {
            $scope.objLibDialog = $mdDialog;
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'AssetService', 'ObjlibService', 'ConfigService', 'TagService', '$q', 'mode', 'objLibDialog', 'objlib', CreateObjlibDialogCtrl],
                templateUrl: '/views/dialogs/create.objlibs.html',
                clickOutsideToClose: true,
                locals: {
                    mode: 'anr',
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

                    ModelService.addNewObject(model_id, objlib, function (data) {

                    });
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

                            if (child.child && child.child.length > 0) {
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
            $mdDialog.hide($scope.objlib.object);
        };
    }

})();