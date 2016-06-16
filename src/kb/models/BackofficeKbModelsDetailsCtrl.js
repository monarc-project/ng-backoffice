(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsDetailsCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', '$stateParams',
            BackofficeKbModelsDetailsCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS
     */
    function BackofficeKbModelsDetailsCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, $stateParams) {
        ModelService.getModel($stateParams.modelId).then(function (data) {
            $scope.model = data;
        });

        /**
         * Risk analysis
         */
        $scope.tree_data = [
            {'id': 1, 'Name': 'test root', __children__: [
                {'id': 2, 'Name': 'test child', __children__: []}
            ]}
        ];
        $scope.my_tree = {};

        $scope.expanding_property = {
            field: 'Name'
        };

        $scope.col_defs = [
            {field: 'Name'}
        ];

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

        $scope.impacts_scale_min = 1;
        $scope.impacts_scale_max = 3;
        $scope.threats_scale_min = 1;
        $scope.threats_scale_max = 3;
        $scope.vulns_scale_min = 1;
        $scope.vulns_scale_max = 3;
    }

})();