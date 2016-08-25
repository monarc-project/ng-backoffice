(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnrObjectInstanceCtrl', [
            '$scope', 'toastr', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', '$state', 'TableHelperService',
            'ModelService', 'ObjlibService', '$stateParams', 'AnrService', '$rootScope', '$timeout',
            BackofficeAnrObjectInstanceCtrl
        ]);

    /**
     * BO > KB > MODELS > MODEL DETAILS > OBJECT INSTANCE
     */
    function BackofficeAnrObjectInstanceCtrl($scope, toastr, $mdMedia, $mdDialog, gettext, gettextCatalog, $state,
                                            TableHelperService, ModelService, ObjlibService, $stateParams, AnrService,
                                            $rootScope, $timeout) {

        $scope.instance = {};

        $rootScope.anr_selected_instance_id = $stateParams.instId;


        var isInstanceLoading = true;

        $scope.updateInstance = function () {
            AnrService.getInstance($scope.model.anr.id, $stateParams.instId).then(function (data) {
                $scope.instance = data;
                isInstanceLoading = false;
            });
        };
        $scope.updateInstance();

        $scope.$watch('instance.risks', function (newValue, oldValue) {
            if (!isInstanceLoading && oldValue !== undefined) {
                for (var i = 0; i < newValue.length; ++i) {
                    var newItem = newValue[i];
                    var oldItem = oldValue[i];

                    if (!angular.equals(newItem, oldItem)) {
                        // This risk changed, update it
                        AnrService.updateInstanceRisk($scope.model.anr.id, newItem.id, newItem);
                    }
                }

                // Update the whole table
                $timeout($scope.updateInstance, 500);
            }
        }, true);

        $scope.$watch('instance.oprisks', function (newValue, oldValue) {
            if (!isInstanceLoading && oldValue !== undefined) {
                for (var i = 0; i < newValue.length; ++i) {
                    var newItem = newValue[i];
                    var oldItem = oldValue[i];

                    if (!angular.equals(newItem, oldItem)) {
                        // This OP risk changed, update it
                        AnrService.updateInstanceOpRisk($scope.model.anr.id, newItem.id, newItem);
                    }
                }

                // Update the whole table
                $timeout($scope.updateInstance, 500);
            }
        }, true);


        $scope.openRiskSheet = function (risk) {
            $scope.sheet_risk = risk;
        };

        $scope.resetSheet = function () {
            $scope.sheet_risk = undefined;
        };


        $scope.openOpRiskSheet = function (risk) {
            $scope.opsheet_risk = risk;
        };

        $scope.resetOpSheet = function () {
            $scope.opsheet_risk = undefined;
        };


        $scope.editInstanceDetails = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'AnrService', 'instance', CreateInstanceDialogCtrl],
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
                AnrService.deleteInstance($scope.model.anr.id, $stateParams.instId, function () {
                    $scope.updateInstances();
                });
                $state.transitionTo('main.kb_mgmt.models.details', {modelId: $scope.model.id});
            });
        };

        $scope.saveRiskSheet = function (sheet) {
            AnrService.updateInstanceRisk($scope.instance.anr.id, sheet.id, sheet, function () {
                toastr.success(gettext('The risk sheet changes have been saved successfully'), gettext('Save successful'));
            })
        };

        $scope.saveOpRiskSheet = function (sheet) {
            AnrService.updateInstanceOpRisk($scope.instance.anr.id, sheet.id, sheet, function () {
                toastr.success(gettext('The operational risk sheet changes have been saved successfully'), gettext('Save successful'));
            })
        };
    }




    function CreateInstanceDialogCtrl($scope, $mdDialog, AnrService, instance) {
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        AnrService.getScalesTypes(instance.anr.id).then(function (data) {
            $scope.scalesTypes = data.types;
        });
    }

})();