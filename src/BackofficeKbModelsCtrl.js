(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ErrorService', 'ModelService',
            BackofficeKbModelsCtrl
        ]);

    /**
     * BO > KB > MODELS
     */
    function BackofficeKbModelsCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                    ErrorService, ModelService) {
        TableHelperService.resetBookmarks();

        $scope.models = TableHelperService.build('label', 10, 1, '');

        $scope.updateModels = function () {
            $scope.models.promise = ModelService.getModels($scope.models.query);
            $scope.models.promise.then(
                function (data) {
                    $scope.models.items = data;
                },

                function (status) {
                    ErrorService.notifyFetchError('models', status);
                }
            )
        };
        $scope.removeModelsFilter = function () {
            TableHelperService.removeFilter($scope.models);
        };

        TableHelperService.watchSearch($scope, 'models.query.filter', $scope.models.query, $scope.updateModels);
        $scope.updateModels();


        $scope.createNewModel = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateModelDialogCtrl],
                templateUrl: '/views/dialogs/create.models.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (model) {
                    ModelService.createModel(model).then(
                        function () {
                            $scope.updateModels();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The model has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created model'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.editModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'user', CreateModelDialogCtrl],
                templateUrl: '/views/dialogs/create.users.admin.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'model': model
                }
            })
                .then(function (model) {
                    ModelService.updateModel(model).then(
                        function () {
                            $scope.updateModels();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The model has been updated successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('updated model'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete model "{{ label }}"?',
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ModelService.deleteModel(item.id).then(
                    function () {
                        $scope.updateModels();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The model "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        ErrorService.notifyFetchError(gettext('deleted model'), status);
                    }
                );
            }, function() {
            });
        };
    }

    function CreateModelDialogCtrl($scope, $mdDialog, model) {
        $scope.language = 1;

        if (model != undefined && model != null) {
            $scope.model = model;
        } else {
            $scope.model = {
                label1: '',
                label2: '',
                label3: '',
                label4: '',
                description1: '',
                description2: '',
                description3: '',
                description4: '',
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.model);
        };
    }
})();