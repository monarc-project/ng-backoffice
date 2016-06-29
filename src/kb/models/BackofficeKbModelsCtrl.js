(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbModelsCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'TableHelperService',
            'ModelService',
            BackofficeKbModelsCtrl
        ]);

    /**
     * BO > KB > MODELS
     */
    function BackofficeKbModelsCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, TableHelperService,
                                    ModelService) {
        TableHelperService.resetBookmarks();

        $scope.models = TableHelperService.build('label1', 10, 1, '');

        $scope.updateModels = function () {
            $scope.models.promise = ModelService.getModels($scope.models.query);
            $scope.models.promise.then(
                function (data) {
                    $scope.models.items = data;
                }
            )
        };
        $scope.removeModelsFilter = function () {
            TableHelperService.removeFilter($scope.models);
        };

        TableHelperService.watchSearch($scope, 'models.query.filter', $scope.models.query, $scope.updateModels);

        $scope.createNewModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ConfigService', 'model', CreateModelDialogCtrl],
                templateUrl: '/views/dialogs/create.models.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    model: model
                }
            })
                .then(function (model) {
                    ModelService.createModel(model,
                        function () {
                            $scope.updateModels();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The model has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function () {
                            $scope.createNewModel(ev, model);
                        }
                    );
                });
        };

        $scope.editModel = function (ev, model) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ModelService.getModel(model.id).then(function (modelData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ConfigService', 'model', CreateModelDialogCtrl],
                    templateUrl: '/views/dialogs/create.models.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'model': modelData
                    }
                })
                    .then(function (model) {
                        ModelService.updateModel(model,
                            function () {
                                $scope.updateModels();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The model has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            },

                            function () {
                                $scope.editModel(ev, model);
                            }
                        );
                    });
            });
        };

        $scope.deleteModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete model "{{ label }}"?',
                    {label: item.label1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ModelService.deleteModel(item.id,
                    function () {
                        $scope.updateModels();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The model "{{label}}" has been deleted.',
                                    {label: item.label1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };

        $scope.deleteModelMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected model(s)?',
                    {count: $scope.models.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.models.selected, function (value, key) {
                    ModelService.deleteModel(value.id,
                        function () {
                            $scope.updateModels();
                        }
                    );
                });

                $scope.models.selected = [];

            }, function() {
            });
        };
    }

    function CreateModelDialogCtrl($scope, $mdDialog, ConfigService, model) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

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
                isDefault: false,
                isScalesUpdatable: false,
                isGeneric: false,
                isRegulator: false,
                showRolfBrut: false
            };
        }

        $scope.$watch('model.isRegulator', function (newValue) {
            if (newValue) {
                $scope.model.isGeneric = false;
            }
        })

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.model);
        };
    }
})();