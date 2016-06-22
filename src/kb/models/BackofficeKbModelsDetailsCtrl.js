(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams',
            BackofficeKbModelsDetailsCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS
     */
    function BackofficeKbModelsDetailsCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams) {
        ModelService.getModel($stateParams.modelId).then(function (data) {
            $scope.model = data;
        });

        /**
         * Risk analysis
         */
        $scope.anr_obj_instances_data = [
            {'id': '__root__', 'label1': 'My Risk Analysis', __children__: [
                {'id': 1, 'label1': 'Object Instance 1', 'ObjectId': 8, __children__: []},
                {'id': 2, 'label1': 'Object Instance 2', 'ObjectId': 8, __children__: []},
            ]}
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
            vulns: {min: '0', max: '3'}
        }

        $scope.info_risk_columns = [];
        $scope.info_risk_rows = [];

        $scope.$watch('scales', function () {
            $scope.updateInfoRiskColumns();
            $scope.info_risk_rows = $scope.range($scope.scales.impacts.min, $scope.scales.impacts.max);
        }, true);

    }

    /////////////////////////////////////////////////////////

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsSubtreeCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams',
            BackofficeKbModelsDetailsSubtreeCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > SUBTREE WORKAROUND
     */
    function BackofficeKbModelsDetailsSubtreeCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams) {
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