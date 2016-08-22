(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnrObjectInstanceCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams', 'AnrService', '$rootScope',
            BackofficeAnrObjectInstanceCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > OBJECT INSTANCE
     */
    function BackofficeAnrObjectInstanceCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog,
                                            TableHelperService, ModelService, ObjlibService, $stateParams, AnrService,
                                            $rootScope) {

        $scope.instance = {};

        $rootScope.anr_selected_instance_id = $stateParams.instId;

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
                controller: ['$scope', '$mdDialog', 'instance', CreateInstanceDialogCtrl],
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
                            toastr.success(gettext("The instance details have been updated"), gettext("Update successful"));
                        });
                    }
                });
        };

        $scope.detachInstance = function (ev) {
            var confirm = $mdDialog.confirm()
                .title(gettext('Are you sure you want to detach this instance?'))
                .textContent(gettext('This instance and all its children will be removed from the risk analysis. This operation cannot be undone.'))
                .ariaLabel('Detach instance')
                .targetEvent(ev)
                .ok(gettext('Detach'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AnrService.deleteInstance($scope.model.anr.id, $stateParams.instId);
            });
        };
    }




    function CreateInstanceDialogCtrl($scope, $mdDialog, instance) {

    }

})();