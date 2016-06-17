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
        $scope.tree_data = [
            {'id': '__root__', 'Name': 'My Risk Analysis', __children__: [
                {'id': 1, 'Name': 'Object Instance 1', 'ObjectId': 8, __children__: []},
                {'id': 2, 'Name': 'Object Instance 2', 'ObjectId': 8, __children__: []},
            ]}
        ];
        $scope.my_tree = {};

        $scope.expanding_property = {
            field: 'Name'
        };

        $scope.col_defs = [
            {field: 'Name'}
        ];

        $scope.callbacks = {
            beforeDrag: function (scopeDrag) {
                return !(scopeDrag.node.id === '__root__');
            },

            accept: function (scopeDrag, scopeTarget, align) {
                return scopeTarget.parent != null;
            }
        };

        ObjlibService.getObjlibs({limit: 0}).then(function (data) {
            console.log(data.objects);
        })

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

})();