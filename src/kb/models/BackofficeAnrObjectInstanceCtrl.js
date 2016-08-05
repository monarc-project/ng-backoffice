(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnrObjectInstanceCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams', 'AnrService',
            BackofficeAnrObjectInstanceCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > OBJECT INSTANCE
     */
    function BackofficeAnrObjectInstanceCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                           TableHelperService, ModelService, ObjlibService, $stateParams, AnrService) {

        $scope.instance = {};

        AnrService.getInstance($scope.model.anr.id, $stateParams.instId).then(function (data) {
            $scope.instance = data;
        });

        $scope.openRiskSheet = function () {
            $scope.sheet_id = 1;
        };

        $scope.resetSheet = function () {
            $scope.sheet_id = undefined;
        };

        $scope.editInstanceDetails = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'instace', CreateInstanceDialogCtrl],
                templateUrl: '/views/dialogs/create.instance.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    instance: $scope.instance
                }
            })
                .then(function (instance) {
                    if (objlib && objlib.id) {
                        AnrService.updateInstance($scope.instance.anr.id, instance, function () {
                            // TODO: Toast
                        });
                    }
                });
        };
    }




    function CreateInstanceDialogCtrl($scope, $mdDialog, instance) {

    }

})();